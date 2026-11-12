-- Dados de referência (idempotente). Sem categorias ninguém consegue criar guilda.
-- Rode no SQL Editor do Supabase (ou use como database/seeds/dev.sql).
INSERT INTO public.categories (name) VALUES
  ('Matemática'),
  ('Física'),
  ('Química'),
  ('Biologia'),
  ('Programação'),
  ('Línguas'),
  ('Humanas'),
  ('Outros')
ON CONFLICT (name) DO NOTHING;

-- Squad 2: categorias de quest (nome, dificuldade e XP base). Sem elas ninguém cria quest.
-- VALORES PROVISÓRIOS, a confirmar pela Squad 2. Mesmo conteúdo de database/migrations/002_quests.sql.
INSERT INTO public.quest_categories (name, difficulty, base_xp) VALUES
  ('Resumo',             'facil',    30),
  ('Curso ou palestra',  'facil',    30),
  ('Estudo',             'medio',    60),
  ('Lista de exercícios', 'medio',   60),
  ('Apresentação',       'medio',    60),
  ('Projeto em grupo',   'dificil', 100),
  ('Prova',              'dificil', 100)
ON CONFLICT (name) DO NOTHING;
