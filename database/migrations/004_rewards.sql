CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    custo_gold INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    tipo_beneficio TEXT NOT NULL,
    limite_semanal INTEGER,
    ativa BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT rewards_codigo_unique UNIQUE (codigo),
    CONSTRAINT rewards_nome_unique UNIQUE (nome),
    CONSTRAINT rewards_custo_gold_positivo
        CHECK (custo_gold > 0),
    CONSTRAINT rewards_limite_semanal_positivo
        CHECK (limite_semanal IS NULL OR limite_semanal > 0)
);
