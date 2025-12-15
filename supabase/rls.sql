-- Helper predicates
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin_or_owner(gid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid
      and gm.user_id = auth.uid()
      and gm.role in ('owner','admin')
  );
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  );
$$;

-- Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- Clear existing policies (idempotent for re-runs)
drop policy if exists groups_select on public.groups;
drop policy if exists groups_insert on public.groups;
drop policy if exists groups_update on public.groups;
drop policy if exists groups_delete on public.groups;

drop policy if exists group_members_select on public.group_members;
drop policy if exists group_members_insert_self on public.group_members;
drop policy if exists group_members_insert_admin on public.group_members;
drop policy if exists group_members_update on public.group_members;
drop policy if exists group_members_delete on public.group_members;

drop policy if exists projects_select on public.projects;
drop policy if exists projects_insert on public.projects;
drop policy if exists projects_update on public.projects;
drop policy if exists projects_delete on public.projects;

drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;

-- groups
create policy groups_select on public.groups
for select
to authenticated
using (
  public.is_group_member(id)
  or created_by = auth.uid()
);

create policy groups_insert on public.groups
for insert
to authenticated
with check (created_by = auth.uid());

create policy groups_update on public.groups
for update
using (public.is_group_admin_or_owner(id))
with check (public.is_group_admin_or_owner(id));

create policy groups_delete on public.groups
for delete
using (public.is_group_admin_or_owner(id));

-- group_members
create policy group_members_select on public.group_members
for select using (public.is_group_member(group_id));

create policy group_members_insert_self on public.group_members
for insert
with check (
  auth.uid() = user_id
  and role = 'member'
);

create policy group_members_insert_admin on public.group_members
for insert
with check (public.is_group_admin_or_owner(group_id));

create policy group_members_update on public.group_members
for update
using (public.is_group_owner(group_id))
with check (public.is_group_owner(group_id));

create policy group_members_delete on public.group_members
for delete
using (
  auth.uid() = user_id
  or public.is_group_admin_or_owner(group_id)
);

-- projects
create policy projects_select on public.projects
for select using (public.is_group_member(group_id));

create policy projects_insert on public.projects
for insert
with check (public.is_group_member(group_id));

create policy projects_update on public.projects
for update
using (public.is_group_admin_or_owner(group_id))
with check (public.is_group_admin_or_owner(group_id));

create policy projects_delete on public.projects
for delete
using (public.is_group_admin_or_owner(group_id));

-- tasks
create policy tasks_select on public.tasks
for select using (
  exists (
    select 1
    from public.projects p
    join public.group_members gm
      on gm.group_id = p.group_id
     and gm.user_id = auth.uid()
    where p.id = tasks.project_id
  )
);

create policy tasks_insert on public.tasks
for insert
with check (
  exists (
    select 1
    from public.projects p
    join public.group_members gm
      on gm.group_id = p.group_id
     and gm.user_id = auth.uid()
    where p.id = tasks.project_id
  )
  and created_by = auth.uid()
);

create policy tasks_update on public.tasks
for update
using (
  exists (
    select 1
    from public.projects p
    join public.group_members gm
      on gm.group_id = p.group_id
     and gm.user_id = auth.uid()
    where p.id = tasks.project_id
  )
)
with check (
  exists (
    select 1
    from public.projects p
    join public.group_members gm
      on gm.group_id = p.group_id
     and gm.user_id = auth.uid()
    where p.id = tasks.project_id
  )
);

create policy tasks_delete on public.tasks
for delete
using (
  exists (
    select 1
    from public.projects p
    join public.group_members gm
      on gm.group_id = p.group_id
     and gm.user_id = auth.uid()
     and gm.role in ('owner','admin')
    where p.id = tasks.project_id
  )
);
