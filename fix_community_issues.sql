-- 1. ASEGURAR QUE TODOS LOS PERFILES SEAN VISIBLES (Fix "No sale en la comunidad")
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 2. ASEGURAR QUE SE PUEDA SEGUIR (Fix "No puede seguir")
drop policy if exists "Authenticated users can follow" on public.follows;
create policy "Authenticated users can follow" 
on public.follows for insert 
with check (auth.uid() = follower_id);

drop policy if exists "Authenticated users can unfollow" on public.follows;
create policy "Authenticated users can unfollow" 
on public.follows for delete 
using (auth.uid() = follower_id);

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone" 
on public.follows for select 
using (true);

-- 3. MEJORAR EL CREACIÓN AUTOMÁTICA DE USUARIOS (Trigger Robustez)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url, country, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Peregrino Nuevo'),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'country', 'ES'),
    coalesce(new.raw_user_meta_data->>'birth_date', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Re-aplicar el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. REPARAR USUARIOS PERDIDOS (Backfill Mágico)
-- Esto busca usuarios registrados que NO tienen perfil y los crea ahora mismo
-- CORREGIDO: raw_user_metadata -> raw_user_meta_data
insert into public.profiles (id, full_name, username, country, avatar_url)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', email),
  coalesce(raw_user_meta_data->>'username', 'peregrino_' || substr(id::text, 1, 4)),
  coalesce(raw_user_meta_data->>'country', 'ES'),
  raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select id from public.profiles);
