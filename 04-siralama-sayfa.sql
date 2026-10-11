-- =====================================================================
--  HEP YANIMDA — Bölüm 4: Sıralama sayfa sayısına göre
--  03-bildirimler.sql'den SONRA çalıştırın. (Tekrar çalıştırmak güvenlidir.)
-- =====================================================================

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
    order by 3 desc, 2 desc, 1;   -- önce toplam sayfa, eşitse kitap sayısı
end;
$$;
