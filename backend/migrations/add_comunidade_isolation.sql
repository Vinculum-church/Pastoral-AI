-- Migração: Isolamento por comunidade
-- Cada comunidade tem dados independentes. Coordenador vê apenas dados da sua comunidade.
-- Admin cria coordenadores com paróquia e comunidade.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- 1. Adicionar comunidade_id ao profiles (coordenador vinculado à comunidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'comunidade_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN comunidade_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_comunidade ON profiles(comunidade_id);

-- 2. Garantir paroquia_id em turmas (para comunidades)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'paroquia_id'
  ) THEN
    ALTER TABLE turmas ADD COLUMN paroquia_id UUID REFERENCES paroquias(id) ON DELETE CASCADE;
    UPDATE turmas t SET paroquia_id = c.paroquia_id FROM comunidades c WHERE t.comunidade_id = c.id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_turmas_comunidade ON turmas(comunidade_id);

-- 3. Adicionar comunidade_id a materiais (opcional, para isolamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiais' AND column_name = 'comunidade_id'
  ) THEN
    ALTER TABLE materiais ADD COLUMN comunidade_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Adicionar comunidade_id a avisos (opcional, para isolamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avisos' AND column_name = 'comunidade_id'
  ) THEN
    ALTER TABLE avisos ADD COLUMN comunidade_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materiais_comunidade ON materiais(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_avisos_comunidade ON avisos(comunidade_id);

-- Para criar o primeiro admin: crie o usuário no Supabase Auth (Authentication > Users)
-- e depois execute (substitua USER_ID pelo id do usuário):
-- INSERT INTO profiles (id, nome, email, role) VALUES ('USER_ID', 'Admin', 'admin@email.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
