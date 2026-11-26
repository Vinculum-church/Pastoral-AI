-- Migração: Escola Pastoral de Formação (conteúdos por segmento + acessos)
-- Execute no SQL Editor do Supabase. Pode rodar mais de uma vez sem problema.
-- =============================================================================
-- Sem esta migração o app continua funcionando: mostra o catálogo base
-- (apostilas e slides que vêm junto com o app), mas o admin não consegue
-- acrescentar conteúdos e o coordenador não consegue liberar acessos.

-- Função auxiliar: papel do usuário logado (texto minúsculo)
CREATE OR REPLACE FUNCTION public.escola_meu_papel()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(role::text, '')) FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.escola_minha_comunidade()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT comunidade_id FROM profiles WHERE id = auth.uid()
$$;

-- 1. Conteúdos criados pelo administrador (e itens do catálogo base escondidos)
CREATE TABLE IF NOT EXISTS escola_conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('apostila', 'slides', 'video', 'link', 'texto')),
  url TEXT NOT NULL DEFAULT '',
  descricao TEXT,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  oculta_padrao_id TEXT,            -- quando preenchido, esconde um item do catálogo base
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escola_conteudos_segmento ON escola_conteudos(segmento_id);

ALTER TABLE escola_conteudos ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário logado lê; só o admin escreve (o painel usa /api/admin/mutation,
-- que confere o papel no servidor; a política abaixo é a segunda trava)
DROP POLICY IF EXISTS escola_conteudos_select ON escola_conteudos;
CREATE POLICY escola_conteudos_select ON escola_conteudos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS escola_conteudos_admin ON escola_conteudos;
CREATE POLICY escola_conteudos_admin ON escola_conteudos
  FOR ALL TO authenticated
  USING (public.escola_meu_papel() LIKE '%admin%')
  WITH CHECK (public.escola_meu_papel() LIKE '%admin%');

-- 2. Segmentos liberados pelo coordenador para cada líder da sua comunidade
CREATE TABLE IF NOT EXISTS escola_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  lider_email TEXT NOT NULL,
  segmento_id TEXT NOT NULL,
  liberado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comunidade_id, lider_email, segmento_id)
);
CREATE INDEX IF NOT EXISTS idx_escola_acessos_comunidade ON escola_acessos(comunidade_id);

ALTER TABLE escola_acessos ENABLE ROW LEVEL SECURITY;

-- Quem é da comunidade lê os acessos da comunidade
DROP POLICY IF EXISTS escola_acessos_select ON escola_acessos;
CREATE POLICY escola_acessos_select ON escola_acessos
  FOR SELECT TO authenticated
  USING (comunidade_id = public.escola_minha_comunidade() OR public.escola_meu_papel() LIKE '%admin%');

-- Só o coordenador da comunidade (ou o admin) libera e retira acessos
DROP POLICY IF EXISTS escola_acessos_coord ON escola_acessos;
CREATE POLICY escola_acessos_coord ON escola_acessos
  FOR ALL TO authenticated
  USING (
    public.escola_meu_papel() LIKE '%admin%'
    OR (public.escola_meu_papel() LIKE 'coord%' AND comunidade_id = public.escola_minha_comunidade())
  )
  WITH CHECK (
    public.escola_meu_papel() LIKE '%admin%'
    OR (public.escola_meu_papel() LIKE 'coord%' AND comunidade_id = public.escola_minha_comunidade())
  );

-- 3. Depósito de arquivos da Escola (PDF, PPTX, imagens) — leitura pública, escrita só do admin
INSERT INTO storage.buckets (id, name, public)
VALUES ('escola', 'escola', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "escola_read" ON storage.objects;
CREATE POLICY "escola_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'escola');

DROP POLICY IF EXISTS "escola_write" ON storage.objects;
CREATE POLICY "escola_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'escola' AND public.escola_meu_papel() LIKE '%admin%');

DROP POLICY IF EXISTS "escola_update" ON storage.objects;
CREATE POLICY "escola_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'escola' AND public.escola_meu_papel() LIKE '%admin%');

DROP POLICY IF EXISTS "escola_delete" ON storage.objects;
CREATE POLICY "escola_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'escola' AND public.escola_meu_papel() LIKE '%admin%');
