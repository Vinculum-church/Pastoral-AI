-- Migração: Coordenador deve ter paróquia e comunidade
-- Execute APENAS se não houver coordenadores sem paroquia_id/comunidade_id.
-- Se houver, atualize-os antes: UPDATE profiles SET paroquia_id = ..., comunidade_id = ... WHERE role = 'coordenador' AND (paroquia_id IS NULL OR comunidade_id IS NULL);
-- =============================================================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_coordenador_paroquia_comunidade;
ALTER TABLE profiles ADD CONSTRAINT chk_coordenador_paroquia_comunidade CHECK (
  (role != 'coordenador') OR (paroquia_id IS NOT NULL AND comunidade_id IS NOT NULL)
);
