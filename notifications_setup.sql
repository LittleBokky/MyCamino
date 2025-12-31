-- 1. RESET (Drop table to ensure clean state and correct FKs)
drop trigger if exists on_new_follow on public.follows;
drop function if exists public.handle_new_follow();
drop table if exists public.notifications cascade;

-- 2. CREATE TABLE WITH CORRECT FOREIGN KEY FOR PROFILES JOIN
-- We explicitly link actor_id to profiles(id) so the frontend 'select' can join them.
-- We also explicitly name the constraint 'notifications_actor_id_fkey' to match the frontend code.
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  actor_id uuid not null,
  type text not null, -- 'follow', etc.
  read boolean default false,
  created_at timestamptz default now(),
  
  constraint notifications_actor_id_fkey 
    foreign key (actor_id) 
    references public.profiles(id) 
    on delete cascade
);

-- 3. ENABLE RLS
alter table public.notifications enable row level security;

-- 4. POLICIES
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- 5. FUNCTION
create or replace function public.handle_new_follow()
returns trigger as $$
begin
  -- Insert notification for the person being followed
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

-- 6. TRIGGER
create trigger on_new_follow
after insert on public.follows
for each row execute function public.handle_new_follow();

-- 7. REALTIME
-- Safe addition to publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
