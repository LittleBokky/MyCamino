-- FIX: Handle date conversion errors safely
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url, country, birth_date)
  values (
    new.id,
    -- Handle Full Name
    coalesce(new.raw_user_meta_data->>'full_name', 'Peregrino Nuevo'),
    -- Handle Username
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 6)),
    -- Handle Avatar
    new.raw_user_meta_data->>'avatar_url',
    -- Handle Country
    coalesce(new.raw_user_meta_data->>'country', 'ES'),
    -- Handle Birth Date (CRITICAL DOC FIX: Empty string crashes date type)
    case 
      when new.raw_user_meta_data->>'birth_date' = '' then null
      when new.raw_user_meta_data->>'birth_date' is null then null
      else (new.raw_user_meta_data->>'birth_date')::date
    end
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- If profile creation fails, we logged it implicitly but allow user creation success
  -- However, for now let's just allow it so the user can at least login
  raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql security definer;
