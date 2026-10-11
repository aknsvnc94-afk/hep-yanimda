-- =====================================================================
--  HEP YANIMDA — Bölüm 6: Öğretmen hesapları yönetici onayıyla açılır
--  05-guvenlik.sql'den SONRA çalıştırın. (Tekrar çalıştırmak güvenlidir.)
--  Mevcut tüm hesaplar onaylı sayılır.
-- =====================================================================

alter table public.profiles add column if not exists approved boolean not null default true;

-- Yeni kayıtta: öğretmen → onay bekler, veli → direkt onaylı
create or replace function public.profiles_before_insert()
returns trigger language plpgsql as $$
begin
  new.approved := (new.role <> 'teacher');
  return new;
end;
$$;
drop trigger if exists profiles_before_insert on public.profiles;
create trigger profiles_before_insert before insert on public.profiles
  for each row execute function public.profiles_before_insert();

create or replace function public.is_teacher_approved(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select approved from public.profiles where id = p_user and role = 'teacher'), false)
$$;

-- Onaysız öğretmen sınıf yönetemez
create or replace function public.is_class_teacher(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid())
     and public.is_teacher_approved(auth.uid())
$$;

-- Onaysız öğretmen sınıf oluşturamaz
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and public.my_role() = 'teacher'
    and public.is_teacher_approved(auth.uid())
    and school_id = public.my_school_id()
  );

-- Onaysız öğretmenin sınıfları velilere görünmez
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated using (
  public.is_admin()
  or teacher_id = auth.uid()
  or (school_id = public.my_school_id() and public.is_teacher_approved(teacher_id))
);

-- Bildirimler: yeni öğretmen → tüm yöneticilere; onay → öğretmene
create or replace function public.notify_teacher_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record; s text;
begin
  if new.role = 'teacher' and not new.approved then
    select name into s from public.schools where id = new.school_id;
    for a in select id from public.profiles where role = 'admin' loop
      perform public.notify(a.id, 'ogretmen_onay', '🍎 Yeni öğretmen onayı',
        coalesce(nullif(new.full_name, ''), new.email) || ' (' || coalesce(s, 'okul yok') || ') öğretmen olarak kayıt oldu.',
        '/admin');
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_teacher_signup on public.profiles;
create trigger notify_teacher_signup after insert on public.profiles
  for each row execute function public.notify_teacher_signup();

create or replace function public.notify_teacher_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'teacher' and new.approved and not old.approved then
    perform public.notify(new.id, 'ogretmen_onaylandi', '🎉 Hesabınız onaylandı',
      'Öğretmen hesabınız aktif. Artık sınıf grubunuzu oluşturabilirsiniz.', '/ogretmen');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_teacher_approved on public.profiles;
create trigger notify_teacher_approved after update of approved on public.profiles
  for each row execute function public.notify_teacher_approved();
