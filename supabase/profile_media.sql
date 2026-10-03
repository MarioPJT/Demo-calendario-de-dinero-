-- Bucket privado: cada cuenta solo puede cargar y descargar los objetos en su carpeta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own profile media" on storage.objects;
drop policy if exists "Users can upload own profile media" on storage.objects;
drop policy if exists "Users can update own profile media" on storage.objects;
drop policy if exists "Users can remove own profile media" on storage.objects;

create policy "Users can view own profile media"
on storage.objects for select to authenticated
using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can upload own profile media"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can update own profile media"
on storage.objects for update to authenticated
using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can remove own profile media"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
