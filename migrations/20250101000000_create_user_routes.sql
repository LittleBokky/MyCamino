create table if not exists user_routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  route_id text, -- ID from FAMOUS_ROUTES if applicable
  start_lat float not null,
  start_lng float not null,
  end_lat float not null,
  end_lng float not null,
  distance_km text,
  duration_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table user_routes enable row level security;

create policy "Users can view their own routes"
  on user_routes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own routes"
  on user_routes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own routes"
  on user_routes for delete
  using (auth.uid() = user_id);
