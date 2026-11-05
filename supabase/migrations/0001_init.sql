-- =============================================================================
-- Objects and Tasks — mini-CRM schema
-- Paste this entire script into the Supabase SQL Editor and run it once.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('manager', 'executor');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum (
      'new',
      'in_progress',
      'in_review',
      'accepted',
      'needs_revision'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

create table if not exists public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  object_id uuid not null references public.objects (id) on delete cascade,
  executor_id uuid not null references public.profiles (id) on delete restrict,
  author_id uuid not null references public.profiles (id) on delete restrict,
  status public.task_status not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  old_status public.task_status,
  new_status public.task_status not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists objects_created_at_idx on public.objects (created_at desc);
create index if not exists tasks_object_id_idx on public.tasks (object_id);
create index if not exists tasks_executor_id_idx on public.tasks (executor_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists task_history_task_id_idx on public.task_history (task_id, created_at);

-- -----------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER to avoid RLS recursion)
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'manager', false);
$$;

create or replace function public.transition_comment()
returns text
language plpgsql
stable
as $$
begin
  return nullif(btrim(current_setting('app.task_comment', true)), '');
exception
  when others then
    return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auto-create a profile when a user signs up
-- Role defaults to executor. Promote managers after signup (see README).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    'executor'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'user'), '@', 1)),
  'executor'::public.user_role
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Profile role protection
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_manager() then
    if new.role is distinct from old.role then
      raise exception 'Only managers can change roles';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile id cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_changes on public.profiles;
create trigger protect_profile_changes
  before update on public.profiles
  for each row
  execute function public.protect_profile_changes();

-- -----------------------------------------------------------------------------
-- Task state machine + history
-- -----------------------------------------------------------------------------
create or replace function public.assert_executor_profile(p_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  select role into v_role from public.profiles where id = p_id;
  if v_role is null then
    raise exception 'Assigned executor does not exist';
  end if;
  if v_role <> 'executor' then
    raise exception 'executor_id must reference a user with the executor role';
  end if;
end;
$$;

create or replace function public.enforce_task_state_machine()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_comment text;
  v_actor uuid;
begin
  v_actor := auth.uid();
  v_role := public.current_user_role();
  v_comment := public.transition_comment();

  if tg_op = 'INSERT' then
    perform public.assert_executor_profile(new.executor_id);

    if v_role is distinct from 'manager' then
      raise exception 'Only managers can create tasks';
    end if;

    new.status := 'new';
    if v_actor is not null then
      new.author_id := v_actor;
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.assert_executor_profile(new.executor_id);

    if v_role = 'executor' then
      if new.executor_id is distinct from old.executor_id
        or new.author_id is distinct from old.author_id
        or new.object_id is distinct from old.object_id
        or new.title is distinct from old.title
        or new.description is distinct from old.description
      then
        raise exception 'Executors may only change the status of their assigned tasks';
      end if;

      if new.executor_id is distinct from v_actor then
        raise exception 'You can only update tasks assigned to you';
      end if;
    end if;

    if new.status is not distinct from old.status then
      return new;
    end if;

    -- Valid transitions and actors
    if old.status = 'new' and new.status = 'in_progress' then
      if v_actor is distinct from old.executor_id then
        raise exception 'Only the assigned executor can start this task';
      end if;
    elsif old.status = 'in_progress' and new.status = 'in_review' then
      if v_actor is distinct from old.executor_id then
        raise exception 'Only the assigned executor can submit this task for review';
      end if;
    elsif old.status = 'in_review' and new.status = 'accepted' then
      if v_role is distinct from 'manager' then
        raise exception 'Only a manager can accept a task';
      end if;
    elsif old.status = 'in_review' and new.status = 'needs_revision' then
      if v_role is distinct from 'manager' then
        raise exception 'Only a manager can request revision';
      end if;
      if v_comment is null then
        raise exception 'A comment is required when requesting revision';
      end if;
    elsif old.status = 'needs_revision' and new.status = 'in_progress' then
      if v_actor is distinct from old.executor_id then
        raise exception 'Only the assigned executor can resume this task';
      end if;
    else
      raise exception
        'Illegal status transition: % -> %',
        old.status,
        new.status;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_task_state_machine on public.tasks;
create trigger enforce_task_state_machine
  before insert or update on public.tasks
  for each row
  execute function public.enforce_task_state_machine();

create or replace function public.log_task_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_history (task_id, actor_id, old_status, new_status, comment)
    values (new.id, coalesce(auth.uid(), new.author_id), null, new.status, public.transition_comment());
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.task_history (task_id, actor_id, old_status, new_status, comment)
    values (new.id, auth.uid(), old.status, new.status, public.transition_comment());
  end if;

  return new;
end;
$$;

drop trigger if exists log_task_history on public.tasks;
create trigger log_task_history
  after insert or update on public.tasks
  for each row
  execute function public.log_task_history();

create or replace function public.prevent_task_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'task_history is append-only';
end;
$$;

drop trigger if exists prevent_task_history_update on public.task_history;
create trigger prevent_task_history_update
  before update or delete on public.task_history
  for each row
  execute function public.prevent_task_history_mutation();

-- RPC used by the frontend so comments ride along with the status change
create or replace function public.transition_task(
  p_task_id uuid,
  p_new_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_task public.tasks;
begin
  perform set_config('app.task_comment', coalesce(p_comment, ''), true);

  update public.tasks
  set status = p_new_status
  where id = p_task_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Task not found or not permitted';
  end if;

  return v_task;
end;
$$;

-- -----------------------------------------------------------------------------
-- Object author
-- -----------------------------------------------------------------------------
create or replace function public.set_object_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'Only managers can create objects';
  end if;
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end;
$$;

drop trigger if exists set_object_created_by on public.objects;
create trigger set_object_created_by
  before insert on public.objects
  for each row
  execute function public.set_object_created_by();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_self_or_manager" on public.profiles;
create policy "profiles_update_self_or_manager"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_manager())
  with check (id = auth.uid() or public.is_manager());

drop policy if exists "profiles_delete_manager" on public.profiles;
create policy "profiles_delete_manager"
  on public.profiles for delete
  to authenticated
  using (public.is_manager());

drop policy if exists "objects_select" on public.objects;
create policy "objects_select"
  on public.objects for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1
      from public.tasks t
      where t.object_id = objects.id
        and t.executor_id = auth.uid()
    )
  );

drop policy if exists "objects_insert_manager" on public.objects;
create policy "objects_insert_manager"
  on public.objects for insert
  to authenticated
  with check (public.is_manager());

drop policy if exists "objects_update_manager" on public.objects;
create policy "objects_update_manager"
  on public.objects for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

drop policy if exists "objects_delete_manager" on public.objects;
create policy "objects_delete_manager"
  on public.objects for delete
  to authenticated
  using (public.is_manager());

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select"
  on public.tasks for select
  to authenticated
  using (public.is_manager() or executor_id = auth.uid());

drop policy if exists "tasks_insert_manager" on public.tasks;
create policy "tasks_insert_manager"
  on public.tasks for insert
  to authenticated
  with check (public.is_manager());

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update"
  on public.tasks for update
  to authenticated
  using (public.is_manager() or executor_id = auth.uid())
  with check (public.is_manager() or executor_id = auth.uid());

drop policy if exists "tasks_delete_manager" on public.tasks;
create policy "tasks_delete_manager"
  on public.tasks for delete
  to authenticated
  using (public.is_manager());

drop policy if exists "task_history_select" on public.task_history;
create policy "task_history_select"
  on public.task_history for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1
      from public.tasks t
      where t.id = task_history.task_id
        and t.executor_id = auth.uid()
    )
  );

-- No insert/update/delete policies on task_history for the API.
-- History rows are written only by the log_task_history trigger.

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.objects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.task_history to authenticated;

revoke insert, update, delete on public.task_history from authenticated, anon;
revoke all on public.task_history from anon;
grant select on public.task_history to authenticated;

grant execute on function public.transition_task(uuid, public.task_status, text) to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_manager() to authenticated;

-- -----------------------------------------------------------------------------
-- After creating users in Authentication > Users, promote a manager:
--   update public.profiles set role = 'manager' where email = 'manager@example.com';
-- -----------------------------------------------------------------------------
