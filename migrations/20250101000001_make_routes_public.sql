-- Update RLS policy to allow public view access to user_routes

-- Drop the restrictive policy
drop policy if exists "Users can view their own routes" on user_routes;

-- Create a permissive policy for viewing
create policy "Users can view all routes"
  on user_routes for select
  using (true);
