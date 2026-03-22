-- Migração: Permitir que admin crie paróquias e comunidades
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
-- Cole o conteúdo abaixo e clique em Run.
-- =============================================================================

-- Política INSERT em paroquias (apenas usuários com role admin)
DROP POLICY IF EXISTS "Admin can insert paroquias" ON paroquias;
CREATE POLICY "Admin can insert paroquias"
  ON paroquias FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Política INSERT em comunidades (apenas usuários com role admin)
DROP POLICY IF EXISTS "Admin can insert comunidades" ON comunidades;
CREATE POLICY "Admin can insert comunidades"
  ON comunidades FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Após executar, o admin poderá criar paróquias e comunidades pelo painel.
