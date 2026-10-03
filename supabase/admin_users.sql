-- Ejecutar en Supabase SQL Editor para habilitar el directorio y los roles de usuarios.
-- Los pagos permanecen protegidos por las políticas existentes y no se exponen aquí.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  display_name text,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
    select p.id, p.display_name, u.email::text, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_user_role(target_user_id uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  if target_role is null or target_role not in ('user', 'admin') then
    raise exception 'Invalid role';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  update public.profiles p
  set role = target_role
  where p.id = target_user_id;

  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
