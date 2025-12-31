-- Script para eliminar un usuario específico por email
-- Esto eliminará al usuario de la tabla de autenticación y, 
-- si las FK están bien configuradas (ON DELETE CASCADE), también de profiles, follows, etc.

delete from auth.users where email = 'fernandoguerrerogalan30@gmail.com';
