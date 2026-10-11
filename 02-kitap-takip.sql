-- =====================================================================
--  HEP YANIMDA — Bölüm 2: Kitap takip
--  schema.sql'den SONRA, Supabase > SQL Editor'de bir kez çalıştırın.
--  (Tekrar çalıştırmak güvenlidir.)
-- =====================================================================

-- ---------- YARDIMCI FONKSİYONLAR ---------------------------------------

-- Giriş yapan kullanıcı bu sınıfın öğretmeni mi?
create or replace function public.is_class_teacher(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid())
$$;

-- Giriş yapan kullanıcı bu sınıfa kayıtlı bir veli mi?
create or replace function public.is_class_parent(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = p_class and parent_id = auth.uid())
$$;

-- ---------- TABLOLAR ----------------------------------------------------

-- Sınıf kitaplığı
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  page_count  integer not null check (page_count between 1 and 5000),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index if not exists books_class_title_unique
  on public.books (class_id, lower(trim(title)));

-- Öğrenci okuma kayıtları
create table if not exists public.readings (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  book_id       uuid not null references public.books (id) on delete restrict,
  member_id     uuid references public.class_members (id) on delete set null,
  parent_id     uuid references public.profiles (id) on delete set null,
  student_name  text not null,
  read_date     date not null,                       -- kaydı yapan cihazın tarihi
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  created_by    uuid references public.profiles (id) on delete set null,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists readings_class_idx   on public.readings (class_id, status, read_date);
create index if not exists readings_parent_idx  on public.readings (parent_id);
create index if not exists readings_book_idx    on public.readings (book_id);
-- Aynı öğrenci aynı kitabı iki kez kaydedemez (reddedilenler hariç)
create unique index if not exists readings_student_book_unique
  on public.readings (class_id, student_name, book_id) where status <> 'rejected';

-- ---------- TETİKLEYİCİLER ---------------------------------------------

-- Okuma kaydı eklenirken: öğrenci bilgilerini sınıf üyeliğinden doldur,
-- öğretmen/admin kaydı → otomatik onaylı, veli kaydı → onay bekliyor.
create or replace function public.readings_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m public.class_members%rowtype;
begin
  select * into m from public.class_members where id = new.member_id;
  if not found or m.class_id <> new.class_id then
    raise exception 'Öğrenci bu sınıfta kayıtlı değil';
  end if;
  if not exists (select 1 from public.books where id = new.book_id and class_id = new.class_id) then
    raise exception 'Kitap bu sınıfın kitaplığında yok';
  end if;

  new.student_name := m.student_name;
  new.parent_id    := m.parent_id;
  new.created_by   := auth.uid();
  if new.read_date is null then new.read_date := current_date; end if;

  if public.is_class_teacher(new.class_id) or public.is_admin() then
    new.status      := 'approved';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    new.status      := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists readings_before_insert on public.readings;
create trigger readings_before_insert
  before insert on public.readings
  for each row execute function public.readings_before_insert();

-- Onay/ret: sadece durum değişebilir, kimin onayladığı otomatik yazılır
create or replace function public.readings_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.class_id     := old.class_id;
  new.book_id      := old.book_id;
  new.member_id    := old.member_id;
  new.parent_id    := old.parent_id;
  new.student_name := old.student_name;
  new.read_date    := old.read_date;
  new.created_by   := old.created_by;
  new.created_at   := old.created_at;
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists readings_before_update on public.readings;
create trigger readings_before_update
  before update on public.readings
  for each row execute function public.readings_before_update();

-- Kitap düzenlenirken sınıfı ve ekleyeni değiştirilemez
create or replace function public.books_before_update()
returns trigger language plpgsql as $$
begin
  new.class_id   := old.class_id;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists books_before_update on public.books;
create trigger books_before_update
  before update on public.books
  for each row execute function public.books_before_update();

-- ---------- SIRALAMA (veli ana ekranı grafikleri için) ------------------
-- Sınıftaki öğrencilerin tarih aralığındaki ONAYLI okumaları:
-- kitap sayısı + toplam sayfa. Veli diğer velilerin kayıtlarını göremediği
-- için sadece bu özet bilgi paylaşılır.
create or replace function public.class_leaderboard(p_class uuid, p_from date, p_to date)
returns table (student_name text, book_count bigint, page_count bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_class_teacher(p_class) or public.is_class_parent(p_class) or public.is_admin()) then
    raise exception 'Yetkiniz yok';
  end if;
  return query
    select r.student_name, count(*)::bigint, coalesce(sum(b.page_count), 0)::bigint
    from public.readings r
    join public.books b on b.id = r.book_id
    where r.class_id = p_class
      and r.status = 'approved'
      and r.read_date between p_from and p_to
    group by r.student_name
    order by 2 desc, 3 desc, 1;
end;
$$;

revoke all on function public.class_leaderboard(uuid, date, date) from public, anon;
grant execute on function public.class_leaderboard(uuid, date, date) to authenticated;

-- ---------- ROW LEVEL SECURITY -----------------------------------------

alter table public.books    enable row level security;
alter table public.readings enable row level security;

-- KİTAPLAR: sınıfın öğretmeni + velileri görür ve ekler; sadece öğretmen/admin düzenler/siler
drop policy if exists books_select on public.books;
create policy books_select on public.books for select to authenticated using (
  public.is_admin() or public.is_class_teacher(class_id) or public.is_class_parent(class_id)
);
drop policy if exists books_insert on public.books;
create policy books_insert on public.books for insert to authenticated with check (
  created_by = auth.uid()
  and (public.is_admin() or public.is_class_teacher(class_id) or public.is_class_parent(class_id))
);
drop policy if exists books_update on public.books;
create policy books_update on public.books for update to authenticated
  using (public.is_admin() or public.is_class_teacher(class_id))
  with check (public.is_admin() or public.is_class_teacher(class_id));
drop policy if exists books_delete on public.books;
create policy books_delete on public.books for delete to authenticated
  using (public.is_admin() or public.is_class_teacher(class_id));

-- OKUMA KAYITLARI
--  * öğretmen/admin: sınıfın tüm kayıtlarını görür, ekler, onaylar/reddeder, siler
--  * veli: sadece kendi öğrencisinin kayıtlarını görür/ekler; onaylanmamışları silebilir
drop policy if exists readings_select on public.readings;
create policy readings_select on public.readings for select to authenticated using (
  public.is_admin() or public.is_class_teacher(class_id) or parent_id = auth.uid()
);
drop policy if exists readings_insert on public.readings;
create policy readings_insert on public.readings for insert to authenticated with check (
  public.is_admin()
  or public.is_class_teacher(class_id)
  or (parent_id = auth.uid() and public.is_class_parent(class_id))
);
drop policy if exists readings_update on public.readings;
create policy readings_update on public.readings for update to authenticated
  using (public.is_admin() or public.is_class_teacher(class_id))
  with check (public.is_admin() or public.is_class_teacher(class_id));
drop policy if exists readings_delete on public.readings;
create policy readings_delete on public.readings for delete to authenticated using (
  public.is_admin()
  or public.is_class_teacher(class_id)
  or (parent_id = auth.uid() and status <> 'approved')
);

grant select, insert, update, delete on public.books, public.readings to authenticated;
