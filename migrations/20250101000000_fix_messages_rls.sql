-- Política para permitir que los receptores marquen los mensajes como leídos
-- Sin esta política, un usuario no puede actualizar las filas de 'messages' que no ha creado él mismo

drop policy if exists "Users can update messages they receive" on messages;

create policy "Users can update messages in their conversations"
on messages for update
using (
  exists (
    select 1 from conversation_participants
    where conversation_id = messages.conversation_id
    and user_id = auth.uid()
  )
);

-- Asegurarse de que el campo 'read' sea accesible para selección también
drop policy if exists "Users can view messages in their conversations" on messages;
create policy "Users can view messages in their conversations"
on messages for select
using (
  exists (
    select 1 from conversation_participants
    where conversation_id = messages.conversation_id
    and user_id = auth.uid()
  )
);
