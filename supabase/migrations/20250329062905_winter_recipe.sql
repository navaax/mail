/*
  # Crear tabla de usuarios y configuración de correo

  1. Nueva Tabla
    - `users`: Almacena información de usuarios registrados
      - `id` (uuid, clave primaria)
      - `email` (texto, único)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `users`
    - Políticas para lectura y eliminación de usuarios autenticados
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para leer usuarios (solo administradores)
CREATE POLICY "Permitir lectura de usuarios a administradores"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'admin');

-- Política para eliminar usuarios (solo administradores)
CREATE POLICY "Permitir eliminación de usuarios a administradores"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'admin');

-- Función para enviar correos (ejemplo)
CREATE OR REPLACE FUNCTION send_email(
  to_email text[],
  subject text,
  content text
) RETURNS void AS $$
BEGIN
  -- Aquí implementarías la lógica real de envío de correo
  -- Este es solo un placeholder para la estructura
  RAISE NOTICE 'Enviando correo a %, asunto: %', to_email, subject;
END;
$$ LANGUAGE plpgsql;