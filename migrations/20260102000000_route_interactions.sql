-- Tabla para likes en rutas
create table if not exists route_likes (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references user_routes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(route_id, user_id)
);

-- Tabla para comentarios en rutas
create table if not exists route_comments (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references user_routes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para mejorar rendimiento
create index if not exists route_likes_route_id_idx on route_likes(route_id);
create index if not exists route_likes_user_id_idx on route_likes(user_id);
create index if not exists route_comments_route_id_idx on route_comments(route_id);
create index if not exists route_comments_user_id_idx on route_comments(user_id);

-- RLS policies para route_likes
alter table route_likes enable row level security;

drop policy if exists "Anyone can view likes" on route_likes;
create policy "Anyone can view likes"
  on route_likes for select
  using (true);

drop policy if exists "Users can like routes" on route_likes;
create policy "Users can like routes"
  on route_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own likes" on route_likes;
create policy "Users can unlike their own likes"
  on route_likes for delete
  using (auth.uid() = user_id);

-- RLS policies para route_comments
alter table route_comments enable row level security;

drop policy if exists "Anyone can view comments" on route_comments;
create policy "Anyone can view comments"
  on route_comments for select
  using (true);

drop policy if exists "Authenticated users can comment" on route_comments;
create policy "Authenticated users can comment"
  on route_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on route_comments;
create policy "Users can delete their own comments"
  on route_comments for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own comments" on route_comments;
create policy "Users can update their own comments"
  on route_comments for update
  using (auth.uid() = user_id);

-- Función para crear notificación cuando alguien da like a una ruta
create or replace function notify_route_like()
returns trigger as $$
declare
  route_owner_id uuid;
  route_name text;
begin
  -- Obtener el dueño de la ruta
  select user_id, name into route_owner_id, route_name
  from user_routes
  where id = NEW.route_id;

  -- Solo crear notificación si el que da like no es el dueño de la ruta
  if route_owner_id != NEW.user_id then
    insert into notifications (user_id, type, message, route_id, from_user_id)
    values (
      route_owner_id,
      'like',
      'le ha gustado tu ruta "' || coalesce(route_name, 'Sin nombre') || '"',
      NEW.route_id,
      NEW.user_id
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger para likes
drop trigger if exists route_like_notification on route_likes;
create trigger route_like_notification
  after insert on route_likes
  for each row
  execute function notify_route_like();

-- Función para crear notificación cuando alguien comenta en una ruta
create or replace function notify_route_comment()
returns trigger as $$
declare
  route_owner_id uuid;
  route_name text;
begin
  -- Obtener el dueño de la ruta
  select user_id, name into route_owner_id, route_name
  from user_routes
  where id = NEW.route_id;

  -- Solo crear notificación si el que comenta no es el dueño de la ruta
  if route_owner_id != NEW.user_id then
    insert into notifications (user_id, type, message, route_id, from_user_id, comment_id)
    values (
      route_owner_id,
      'comment',
      'ha comentado en tu ruta "' || coalesce(route_name, 'Sin nombre') || '"',
      NEW.route_id,
      NEW.user_id,
      NEW.id
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger para comentarios
drop trigger if exists route_comment_notification on route_comments;
create trigger route_comment_notification
  after insert on route_comments
  for each row
  execute function notify_route_comment();
