-- Required extension for gen_random_uuid
create extension if not exists pgcrypto;

-- Core tables
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Ensure created_by kolonu mevcut (idempotent)
alter table if exists public.groups
  add column if not exists created_by uuid references auth.users(id);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  assignee_user_id uuid null references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper: generate short invite codes
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  charset constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code_length int := 8;
begin
  loop
    candidate := '';
    for i in 1..code_length loop
      candidate := candidate || substr(charset, floor(random() * length(charset) + 1)::int, 1);
    end loop;

    if not exists (select 1 from public.groups g where g.invite_code = candidate) then
      return candidate;
    end if;
  end loop;
end;
$$;

-- Trigger: set invite_code when missing
create or replace function public.handle_group_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or length(trim(new.invite_code)) = 0 then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_groups_invite_code on public.groups;
create trigger trg_groups_invite_code
before insert on public.groups
for each row
execute function public.handle_group_invite_code();

-- Trigger: insert owner membership after group creation
create or replace function public.handle_group_owner_membership()
returns trigger
language plpgsql
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_groups_owner_membership on public.groups;
create trigger trg_groups_owner_membership
after insert on public.groups
for each row
execute function public.handle_group_owner_membership();

-- Trigger: update tasks.updated_at on modification
create or replace function public.set_task_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_task_updated_at();

-- Helpful indexes
create index if not exists idx_group_members_user_id on public.group_members (user_id);
create index if not exists idx_projects_group_id on public.projects (group_id);
create index if not exists idx_tasks_project_id on public.tasks (project_id);
create index if not exists idx_tasks_assignee_user_id on public.tasks (assignee_user_id);
