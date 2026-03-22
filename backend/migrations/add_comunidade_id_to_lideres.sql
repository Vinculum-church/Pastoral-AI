-- Migração: Adicionar coluna comunidade_id em lideres
-- Líderes herdam paróquia e comunidade do coordenador que os cadastrou.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lideres' AND column_name = 'comunidade_id'
  ) THEN
    ALTER TABLE lideres ADD COLUMN comunidade_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lideres_comunidade ON lideres(comunidade_id);
