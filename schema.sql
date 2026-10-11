-- =====================================================================
--  HEP YANIMDA — Veritabanı şeması (Bölüm 1: Kullanıcılar, okullar, sınıflar)
--  Supabase > SQL Editor içine yapıştırıp bir kez çalıştırın.
-- =====================================================================

-- ---------- TABLOLAR ----------------------------------------------------

create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  created_at  timestamptz not null default now(),
  constraint schools_name_city_unique unique (name, city)
);

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  role          text not null check (role in ('teacher', 'parent', 'admin')),
  school_id     uuid references public.schools (id) on delete set null,
  student_name  text,
  confirmed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  constraint classes_teacher_name_unique unique (teacher_id, name)
);

create table if not exists public.class_members (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  parent_id     uuid not null references public.profiles (id) on delete cascade,
  student_name  text not null check (length(trim(student_name)) > 0),
  created_at    timestamptz not null default now(),
  -- Bir öğrenci aynı anda tek bir sınıfta olabilir
  constraint class_members_student_unique unique (parent_id, student_name)
);

create index if not exists profiles_school_idx       on public.profiles (school_id);
create index if not exists classes_school_idx        on public.classes (school_id);
create index if not exists classes_teacher_idx       on public.classes (teacher_id);
create index if not exists class_members_class_idx   on public.class_members (class_id);
create index if not exists class_members_parent_idx  on public.class_members (parent_id);

-- ---------- YARDIMCI FONKSİYONLAR (RLS için) ---------------------------
-- security definer: RLS'e takılmadan giriş yapan kullanıcının bilgisini okur

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ---------- KAYIT TETİKLEYİCİSİ ---------------------------------------
-- auth.signUp sırasında gönderilen bilgilerden (role, full_name, school_id,
-- student_name) otomatik profil oluşturur. Admin rolü buradan verilemez.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role    text  := meta ->> 'role';
  v_school  uuid;
  v_student text  := nullif(trim(meta ->> 'student_name'), '');
begin
  begin
    v_school := nullif(meta ->> 'school_id', '')::uuid;
  exception when invalid_text_representation then
    v_school := null;
  end;

  if v_role in ('teacher', 'parent') then
    if v_school is null or not exists (select 1 from public.schools where id = v_school) then
      raise exception 'Geçerli bir okul seçilmelidir';
    end if;
    if v_role = 'parent' and v_student is null then
      raise exception 'Veli kaydında öğrenci adı zorunludur';
    end if;
  else
    -- Panelden elle oluşturulan kullanıcılar: rolsüz gelir, veli sayılır.
    -- Admin yapmak için README'deki SQL komutunu kullanın.
    v_role := 'parent';
  end if;

  insert into public.profiles (id, email, full_name, role, school_id, student_name, confirmed_at)
  values (
    new.id,
    new.email,
    coalesce(trim(meta ->> 'full_name'), ''),
    v_role,
    v_school,
    case when v_role = 'parent' then v_student else null end,
    new.email_confirmed_at
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mail kodu doğrulanınca profildeki onay tarihini güncelle
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set confirmed_at = new.email_confirmed_at where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.handle_user_confirmed();

-- ---------- ADMIN: kullanıcı silme ------------------------------------

create or replace function public.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Yetkiniz yok';
  end if;
  if target = auth.uid() then
    raise exception 'Kendi hesabınızı silemezsiniz';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------- ROW LEVEL SECURITY -----------------------------------------

alter table public.schools        enable row level security;
alter table public.profiles       enable row level security;
alter table public.classes        enable row level security;
alter table public.class_members  enable row level security;

-- OKULLAR: herkes okuyabilir (kayıt ekranındaki liste için), sadece admin yönetir
drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools for select to anon, authenticated using (true);
drop policy if exists schools_admin_write on public.schools;
create policy schools_admin_write on public.schools for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- PROFİLLER
--  * herkes kendi profilini görür
--  * admin hepsini görür
--  * aynı okuldaki öğretmenler görünür (veli sınıf seçerken öğretmen adını görsün)
--  * öğretmen, kendi sınıfına katılan velileri görür
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or (role = 'teacher' and school_id = public.my_school_id())
  or exists (
    select 1 from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.parent_id = profiles.id and c.teacher_id = auth.uid()
  )
);
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- SINIFLAR
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (public.is_admin() or school_id = public.my_school_id());
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and public.my_role() = 'teacher'
    and school_id = public.my_school_id()
  );
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete to authenticated
  using (teacher_id = auth.uid() or public.is_admin());

-- SINIF ÜYELİKLERİ (veli ↔ sınıf eşleşmesi)
drop policy if exists members_select on public.class_members;
create policy members_select on public.class_members for select to authenticated using (
  parent_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
);
drop policy if exists members_insert on public.class_members;
create policy members_insert on public.class_members for insert to authenticated
  with check (
    parent_id = auth.uid()
    and public.my_role() = 'parent'
    and exists (select 1 from public.classes c
                where c.id = class_id and c.school_id = public.my_school_id())
  );
drop policy if exists members_delete on public.class_members;
create policy members_delete on public.class_members for delete to authenticated using (
  parent_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
);

-- ---------- YETKİLER ---------------------------------------------------
grant select on public.schools to anon;
grant select, insert, update, delete on public.schools, public.profiles,
  public.classes, public.class_members to authenticated;
