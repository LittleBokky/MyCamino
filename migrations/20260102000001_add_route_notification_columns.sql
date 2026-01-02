-- Asegurar que la tabla notifications tenga las columnas necesarias para las interacciones de rutas
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'actor_id') then
        alter table notifications add column actor_id uuid references profiles(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'route_id') then
        alter table notifications add column route_id uuid references user_routes(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'comment_id') then
        alter table notifications add column comment_id uuid references route_comments(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'message') then
        alter table notifications add column message text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'read') then
        alter table notifications add column read boolean default false;
    end if;
end $$;
