-- Migração: foto do participante (Supabase Storage)
-- Execute no SQL Editor do Supabase ANTES de usar o upload de foto.
-- =============================================================================

-- 1. Coluna com a URL pública da foto (participantes e perfil do usuário)
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Bucket público de leitura (as fotos são redimensionadas no navegador, ~400px)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas: qualquer um lê (bucket público); só usuários logados escrevem
DROP POLICY IF EXISTS "fotos_read" ON storage.objects;
CREATE POLICY "fotos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');

DROP POLICY IF EXISTS "fotos_insert" ON storage.objects;
CREATE POLICY "fotos_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');

DROP POLICY IF EXISTS "fotos_update" ON storage.objects;
CREATE POLICY "fotos_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'fotos');

DROP POLICY IF EXISTS "fotos_delete" ON storage.objects;
CREATE POLICY "fotos_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'fotos');
