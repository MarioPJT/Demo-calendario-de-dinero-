-- Ejecuta este archivo en Supabase → SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Mi espacio',
  role text not null default 'user' check (role in ('user', 'admin')),
  settings jsonb not null default '{"workspace":"Mi espacio","currency":"COP","defaultTime":"09:00","weekStart":"monday","accent":"#9686e7"}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null,
  time time not null,
  note text not null default '',
  color text not null default '#9C8CF4',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.payments enable row level security;
-- El navegador solo puede editar preferencias; el rol admin se asigna con privilegios de servidor.
revoke update on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name, settings) on public.profiles to authenticated;
grant select, insert, update, delete on public.payments to authenticated;

create policy "Users can read their profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can create their profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()) and role = 'user');
create policy "Users can update their profile settings" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Users can read their payments" on public.payments for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can create their payments" on public.payments for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their payments" on public.payments for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users can delete their payments" on public.payments for delete to authenticated using (user_id = (select auth.uid()));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

-- Después de crear tu cuenta, ejecuta esta línea sustituyendo el correo del admin:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'TU_CORREO');
