-- VEGANFARM Phase 7 read-only preflight. SELECT statements only.

select id,name,public,file_size_limit,allowed_mime_types
from storage.buckets
where id in ('case-photos','rescue-case-photos')
order by id;

select policyname,permissive,roles,cmd,qual,with_check
from pg_policies
where schemaname='storage' and tablename='objects'
  and (
    coalesce(qual,'') ilike '%case-photos%'
    or coalesce(with_check,'') ilike '%case-photos%'
    or policyname ilike '%rescue%photo%'
    or policyname ilike '%case%photo%'
  )
order by policyname;

select o.bucket_id,o.name as object_path,o.metadata->>'mimetype' as mime_type,
       (o.metadata->>'size')::bigint as bytes,rc.id as case_id,rc.animal_name,
       rc.publication,rc.photo_path
from storage.objects o
left join public.rescue_cases rc
  on rc.photo_path=o.name or rc.photo_path=o.bucket_id || '/' || o.name
where o.bucket_id in ('case-photos','rescue-case-photos')
order by o.bucket_id,o.name;

select count(*) filter(where photo_path is not null) as rows_with_photo_path,
       count(*) filter(where photo_path like 'rescue-case-photos/%') as prefixed_private_paths,
       count(*) filter(where photo_url is not null and btrim(photo_url)<>'') as rows_with_external_photo_url
from public.rescue_cases;

select publication,count(*) as public_projection_rows
from public.public_rescue_cases
group by publication;
