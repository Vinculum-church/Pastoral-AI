-- Migração: Adicionar coluna comunidade_id em profiles
-- Execute no SQL Editor do Supabase se a coluna ainda não existir.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'comunidade_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN comunidade_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_comunidade ON profiles(comunidade_id);

-- Após rodar esta migração, se já existir coordenador sem comunidade_id,
-- atualize manualmente: UPDATE profiles SET paroquia_id = 'UUID_PAROQUIA', comunidade_id = 'UUID_COMUNIDADE' WHERE id = 'UUID_COORDENADOR';
