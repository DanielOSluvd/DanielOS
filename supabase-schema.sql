-- Daniel OS cloud schema
-- Run this entire file once in Supabase Dashboard → SQL Editor.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

revoke all on table public.user_state from anon;
grant select, insert, update, delete on table public.user_state to authenticated;

create policy "Users can read their Daniel OS state"
on public.user_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Daniel OS state"
on public.user_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Daniel OS state"
on public.user_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Daniel OS state"
on public.user_state for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_user_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_state_updated_at on public.user_state;
create trigger set_user_state_updated_at
before update on public.user_state
for each row execute function public.set_user_state_updated_at();
