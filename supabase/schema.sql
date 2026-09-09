-- Arkspace V2.1 database + storage foundation
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  size bigint not null default 0,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(wid uuid)
returns boolean language sql security definer stable
set search_path = public
as $$ select exists (
  select 1 from public.workspace_members
  where workspace_id = wid and user_id = auth.uid()
); $$;

create or replace function public.is_workspace_admin(wid uuid)
returns boolean language sql security definer stable
set search_path = public
as $$ select exists (
  select 1 from public.workspace_members
  where workspace_id = wid and user_id = auth.uid() and role in ('owner','admin')
); $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.files enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "workspace members read" on public.workspace_members;
create policy "workspace members read" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace owner creates membership" on public.workspace_members;
create policy "workspace owner creates membership" on public.workspace_members for insert to authenticated with check (
  public.is_workspace_admin(workspace_id) or user_id = auth.uid()
);

drop policy if exists "workspace read" on public.workspaces;
create policy "workspace read" on public.workspaces for select to authenticated using (public.is_workspace_member(id));

drop policy if exists "workspace create" on public.workspaces;
create policy "workspace create" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "workspace update" on public.workspaces;
create policy "workspace update" on public.workspaces for update to authenticated using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));

drop policy if exists "files member read" on public.files;
create policy "files member read" on public.files for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "files member insert" on public.files;
create policy "files member insert" on public.files for insert to authenticated with check (
  owner_id = auth.uid() and public.is_workspace_member(workspace_id)
);

drop policy if exists "files owner delete" on public.files;
create policy "files owner delete" on public.files for delete to authenticated using (
  owner_id = auth.uid() or public.is_workspace_admin(workspace_id)
);

drop policy if exists "tasks member read" on public.tasks;
create policy "tasks member read" on public.tasks for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "tasks member insert" on public.tasks;
create policy "tasks member insert" on public.tasks for insert to authenticated with check (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "tasks member update" on public.tasks;
create policy "tasks member update" on public.tasks for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "notes member read" on public.notes;
create policy "notes member read" on public.notes for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "notes member insert" on public.notes;
create policy "notes member insert" on public.notes for insert to authenticated with check (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "notes member update" on public.notes;
create policy "notes member update" on public.notes for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

-- Profile creation trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id,email,display_name)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('workspace-files','workspace-files',false)
on conflict (id) do nothing;

drop policy if exists "workspace storage read" on storage.objects;
create policy "workspace storage read" on storage.objects
for select to authenticated
using (
  bucket_id = 'workspace-files'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "workspace storage upload" on storage.objects;
create policy "workspace storage upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'workspace-files'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "workspace storage delete" on storage.objects;
create policy "workspace storage delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'workspace-files'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);