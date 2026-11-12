CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(120) NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 1 AND 120),
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  senha_hash TEXT NOT NULL,
  papel VARCHAR(20) NOT NULL DEFAULT 'estudante'
    CHECK (papel IN ('estudante', 'monitor', 'administrador')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
