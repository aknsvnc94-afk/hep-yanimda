-- =====================================================================
--  HEP YANIMDA — Bölüm 5: Güvenlik sıkılaştırmaları (sadece veritabanı)
--  Uygulama güncellemesi gerektirmez. Tekrar çalıştırmak güvenlidir.
-- =====================================================================

-- 1) Öğretmen sınıfını başka okula taşıyamaz / başkasına devredemez (admin hariç)
create or replace function public.classes_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.school_id  := old.school_id;
    new.teacher_id := old.teacher_id;
  end if;
  new.created_at := old.created_at;
  return new;
end;
$$;
drop trigger if exists classes_before_update on public.classes;
create trigger classes_before_update before update on public.classes
  for each row execute function public.classes_before_update();

-- 2) Bildirim şifresi tanımlı değilse abonelik silme fonksiyonu hiç çalışmasın
create or replace function public.remove_push_subscription(p_endpoint text, p_secret text)
returns void language plpgsql security definer set search_path = public as $$
declare v_secret text := (select value from public.app_config where key = 'push_secret');
begin
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    raise exception 'Yetkisiz';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

-- 3) Veli okuma tarihini ileri/çok geri bir tarihe ayarlayıp sıralamayı kaydıramasın
--    (cihaz tarihi kullanılır; Türkiye saatine göre bugün ve son 7 gün kabul edilir)
create or replace function public.readings_clamp_date()
returns trigger language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  if auth.uid() is not null and not (public.is_class_teacher(new.class_id) or public.is_admin()) then
    if new.read_date is null or new.read_date > today or new.read_date < today - 7 then
      new.read_date := today;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists readings_clamp_date on public.readings;
create trigger readings_clamp_date before insert on public.readings
  for each row execute function public.readings_clamp_date();

-- 4) Yardımcı/iç fonksiyonlar dışarıdan (RPC) çağrılamasın
revoke all on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_delete_user(uuid) from anon;
