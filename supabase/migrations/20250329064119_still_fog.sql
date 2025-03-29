/*
  # Agregar sistema de menciones y temas

  1. Nuevas Tablas
    - `emails`: Almacena el historial de correos enviados
      - `id` (uuid, primary key)
      - `subject` (text)
      - `content` (text)
      - `sender_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `mentions`: Almacena las menciones de usuarios
      - `id` (uuid, primary key)
      - `email_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `threads`: Almacena los temas/hilos
      - `id` (uuid, primary key)
      - `email_id` (uuid, foreign key)
      - `topic` (text)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para lectura y escritura
*/

-- Tabla de correos enviados
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de menciones
CREATE TABLE IF NOT EXISTS mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de temas/hilos
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Políticas para emails
CREATE POLICY "Usuarios pueden ver correos donde son mencionados"
  ON emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentions
      WHERE mentions.email_id = emails.id
      AND mentions.user_id = auth.uid()
    )
    OR emails.sender_id = auth.uid()
  );

CREATE POLICY "Usuarios pueden crear correos"
  ON emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Políticas para menciones
CREATE POLICY "Usuarios pueden ver sus menciones"
  ON mentions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear menciones"
  ON mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = mentions.email_id
      AND emails.sender_id = auth.uid()
    )
  );

-- Políticas para threads
CREATE POLICY "Usuarios pueden ver hilos relacionados"
  ON threads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = threads.email_id
      AND (
        emails.sender_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM mentions
          WHERE mentions.email_id = emails.id
          AND mentions.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Usuarios pueden crear hilos"
  ON threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = threads.email_id
      AND emails.sender_id = auth.uid()
    )
  );