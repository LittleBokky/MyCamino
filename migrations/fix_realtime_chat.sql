-- Habilitar Realtime para la tabla messages de forma segura
-- Usamos un bloque DO para manejar errores si la tabla ya está en la publicación

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL; -- Ignorar si ya existe
  END;
END $$;

-- Asegurar que la política de lectura permite recibir los mensajes
DROP POLICY IF EXISTS "Users can view messages" ON messages;

CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Forzar replica identity para asegurar que se envían los datos completos
ALTER TABLE messages REPLICA IDENTITY FULL;
