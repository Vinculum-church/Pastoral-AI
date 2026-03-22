-- Migração: Isolamento de dados por paróquia
-- Execute no SQL Editor do Supabase para que cada coordenador veja apenas os dados da sua paróquia.
-- =============================================================================

-- 1. Adicionar paroquia_id à tabela turmas (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'paroquia_id'
  ) THEN
    ALTER TABLE turmas ADD COLUMN paroquia_id UUID REFERENCES paroquias(id) ON DELETE CASCADE;
    
    -- Preencher paroquia_id a partir da comunidade (para turmas existentes)
    UPDATE turmas t
    SET paroquia_id = c.paroquia_id
    FROM comunidades c
    WHERE t.comunidade_id = c.id AND t.paroquia_id IS NULL;
  END IF;
END $$;

-- 2. Índice para consultas por paróquia
CREATE INDEX IF NOT EXISTS idx_turmas_paroquia ON turmas(paroquia_id);

-- 3. Índice para materiais por paróquia (se não existir)
CREATE INDEX IF NOT EXISTS idx_materiais_paroquia ON materiais(paroquia_id);
