-- =====================================================================
--  HEP YANIMDA — Bölüm 3: Öğrenci onayı, bildirimler, kitap adı kontrolü
--  02-kitap-takip.sql'den SONRA, Supabase > SQL Editor'de bir kez çalıştırın.
--  (Tekrar çalıştırmak güvenlidir.)
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- ---------- 1) SINIF KAYDINA ÖĞRETMEN ONAYI -----------------------------

-- Mevcut kayıtlar onaylı sayılır, yeni katılımlar onay bekler
alter table public.class_members
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved'));
alter table public.class_members alter column status set default 'pending';

-- Veli yalnızca ONAYLI üyeliğiyle sınıfın kitaplık/okuma işlemlerine erişir
create or replace function public.is_class_parent(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_members
    where class_id = p_class and parent_id = auth.uid() and status = 'approved'
  )
$$;

-- Katılım isteği her zaman "onay bekliyor" olarak başlar
create or replace function public.class_members_before_insert()
returns trigger language plpgsql as $$
begin
  new.status := 'pending';
  return new;
end;
$$;
drop trigger if exists class_members_before_insert on public.class_members;
create trigger class_members_before_insert
  before insert on public.class_members
  for each row execute function public.class_members_before_insert();

-- Onay sırasında sadece durum değişebilir
create or replace function public.class_members_before_update()
returns trigger language plpgsql as $$
begin
  new.class_id     := old.class_id;
  new.parent_id    := old.parent_id;
  new.student_name := old.student_name;
  new.created_at   := old.created_at;
  return new;
end;
$$;
drop trigger if exists class_members_before_update on public.class_members;
create trigger class_members_before_update
  before update on public.class_members
  for each row execute function public.class_members_before_update();

drop policy if exists members_update on public.class_members;
create policy members_update on public.class_members for update to authenticated
  using (public.is_admin() or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- Onaylanmamış öğrenci adına kitap kaydı yapılamaz
create or replace function public.readings_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m public.class_members%rowtype;
begin
  select * into m from public.class_members where id = new.member_id;
  if not found or m.class_id <> new.class_id then
    raise exception 'Öğrenci bu sınıfta kayıtlı değil';
  end if;
  if m.status <> 'approved' then
    raise exception 'Öğrencinin sınıf kaydı henüz öğretmen tarafından onaylanmadı';
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

-- ---------- 2) AYNI İSİMLİ KİTAP ENGELİ ---------------------------------
-- "Küçük Prens", "KÜÇÜK  PRENS", "kucuk prens." hepsi aynı kitap sayılır.

create or replace function public.book_key(t text)
returns text language sql immutable as $$
  select trim(regexp_replace(
           regexp_replace(
             lower(translate(coalesce(t, ''), 'İIıŞşĞğÜüÖöÇçÂâÎîÛû', 'iiissgguuooccaaiiuu')),
             '[^a-z0-9 ]', '', 'g'),
           '\s+', ' ', 'g'))
$$;

alter table public.books add column if not exists title_key text
  generated always as (public.book_key(title)) stored;

-- Önceden oluşmuş aynı isimli kitaplar varsa silinmez, sonuna (2), (3) eklenir
with d as (
  select id, row_number() over (partition by class_id, public.book_key(title) order by created_at, id) as rn
  from public.books
)
update public.books b set title = b.title || ' (' || d.rn || ')'
from d where d.id = b.id and d.rn > 1;

drop index if exists public.books_class_title_unique;
create unique index if not exists books_title_key_unique on public.books (class_id, title_key);

-- ---------- 3) BİLDİRİMLER ----------------------------------------------

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text not null default '',
  url         text not null default '/',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Gizli ayarlar (telefon bildirimi adresi ve şifresi) — kimse okuyamaz
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

drop policy if exists push_select on public.push_subscriptions;
create policy push_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists push_insert on public.push_subscriptions;
create policy push_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists push_update on public.push_subscriptions;
create policy push_update on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists push_delete on public.push_subscriptions;
create policy push_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

grant select, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Bildirim oluşturma (sadece tetikleyiciler kullanır)
create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, title, body, url)
  values (p_user, p_type, p_title, coalesce(p_body, ''), coalesce(p_url, '/'));
end;
$$;
revoke all on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- Yeni bildirim → telefon bildirimi (ayar yapılmışsa uygulamanın /api/push adresine gönderir)
create or replace function public.notifications_push()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_url    text := (select value from public.app_config where key = 'push_url');
  v_secret text := (select value from public.app_config where key = 'push_secret');
  v_subs   jsonb;
begin
  if v_url is null or v_secret is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::jsonb)
    into v_subs from public.push_subscriptions where user_id = new.user_id;
  if jsonb_array_length(v_subs) = 0 then return new; end if;
  perform net.http_post(
    url     := v_url,
    body    := jsonb_build_object('title', new.title, 'body', new.body, 'url', new.url, 'tag', new.type, 'subscriptions', v_subs),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret)
  );
  return new;
exception when others then
  return new; -- bildirim gönderilemese bile işlem bozulmasın
end;
$$;
drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.notifications_push();

-- Süresi dolan telefon aboneliklerini /api/push siler (şifre ile)
create or replace function public.remove_push_subscription(p_endpoint text, p_secret text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select value from public.app_config where key = 'push_secret') then
    raise exception 'Yetkisiz';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;
grant execute on function public.remove_push_subscription(text, text) to anon, authenticated;

-- ---------- 4) BİLDİRİM TETİKLEYİCİLERİ ---------------------------------

-- Veli sınıfa katılmak istedi → öğretmene
create or replace function public.notify_member_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select id, name, teacher_id into c from public.classes where id = new.class_id;
  perform public.notify(c.teacher_id, 'ogrenci_onay',
    '🧒 Yeni öğrenci onayı',
    new.student_name || ', ' || c.name || ' sınıfına katılmak istiyor.',
    '/sinif/' || c.id || '?sekme=ogrenciler');
  return new;
end;
$$;
drop trigger if exists notify_member_insert on public.class_members;
create trigger notify_member_insert after insert on public.class_members
  for each row execute function public.notify_member_insert();

-- Öğretmen öğrenciyi onayladı → veliye
create or replace function public.notify_member_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if old.status = 'pending' and new.status = 'approved' then
    select id, name into c from public.classes where id = new.class_id;
    perform public.notify(new.parent_id, 'sinif_onaylandi',
      '🎉 Sınıf kaydı onaylandı',
      new.student_name || ' artık ' || c.name || ' sınıfında. Okuduğu kitapları kaydedebilirsiniz.',
      '/veli');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_member_update on public.class_members;
create trigger notify_member_update after update of status on public.class_members
  for each row execute function public.notify_member_update();

-- Veli kitap kaydetti → öğretmene
create or replace function public.notify_reading_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record; b record;
begin
  if new.status <> 'pending' then return new; end if;
  select id, name, teacher_id into c from public.classes where id = new.class_id;
  select title into b from public.books where id = new.book_id;
  perform public.notify(c.teacher_id, 'kitap_onay',
    '📖 Kitap onayı bekliyor',
    new.student_name || ' — "' || b.title || '" (' || c.name || ')',
    '/sinif/' || c.id || '?sekme=kitap&alt=giris');
  return new;
end;
$$;
drop trigger if exists notify_reading_insert on public.readings;
create trigger notify_reading_insert after insert on public.readings
  for each row execute function public.notify_reading_insert();

-- Öğretmen kaydı onayladı/reddetti → veliye
create or replace function public.notify_reading_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if old.status = new.status or new.parent_id is null then return new; end if;
  select title into b from public.books where id = new.book_id;
  if new.status = 'approved' then
    perform public.notify(new.parent_id, 'kitap_onaylandi',
      '✅ Kitap onaylandı',
      new.student_name || ' — "' || b.title || '" onaylandı. Tebrikler! 🎉',
      '/veli');
  elsif new.status = 'rejected' then
    perform public.notify(new.parent_id, 'kitap_reddedildi',
      '⚠️ Kitap kaydı reddedildi',
      new.student_name || ' — "' || b.title || '" kaydı öğretmen tarafından reddedildi.',
      '/sinif/' || new.class_id || '?sekme=kitap&alt=giris');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_reading_update on public.readings;
create trigger notify_reading_update after update of status on public.readings
  for each row execute function public.notify_reading_update();

-- Öğretmen katılım isteğini reddetti (sildi) → veliye
create or replace function public.notify_member_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if old.status = 'pending' and auth.uid() is distinct from old.parent_id then
    select name into c from public.classes where id = old.class_id;
    perform public.notify(old.parent_id, 'sinif_reddedildi',
      '⚠️ Sınıf kaydı onaylanmadı',
      old.student_name || ' için ' || coalesce(c.name, 'sınıf') || ' katılım isteği onaylanmadı. Doğru sınıfı seçip tekrar deneyebilirsiniz.',
      '/veli');
  end if;
  return old;
end;
$$;
drop trigger if exists notify_member_delete on public.class_members;
create trigger notify_member_delete after delete on public.class_members
  for each row execute function public.notify_member_delete();
