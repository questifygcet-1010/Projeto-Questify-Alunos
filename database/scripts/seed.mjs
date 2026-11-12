import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import connection from '../../server/persistence/postgres/config.js';
import password from '../../server/business/domain/auth/password.js';

export const SEED_PASSWORD = 'Questify@123';
export const SEED_USERS = [
  { id: '00000000-0000-4000-8000-000000000001', nome: 'Aluno Teste', email: 'aluno.teste@questify.local', papel: 'estudante' },
  { id: '00000000-0000-4000-8000-000000000002', nome: 'Monitor Teste', email: 'monitor.teste@questify.local', papel: 'monitor' },
  { id: '00000000-0000-4000-8000-000000000003', nome: 'Admin Teste', email: 'admin.teste@questify.local', papel: 'administrador' },
];

/** Seeds só rodam em desenvolvimento e staging (APP_ENV tem precedência sobre NODE_ENV). */
export function assertSeedAllowed(env = process.env) {
  const target = String(env.APP_ENV || env.NODE_ENV || '').toLowerCase();
  if (env.VERCEL_ENV === 'production' || !['development', 'staging'].includes(target)) {
    throw new Error(`Seeds são permitidos apenas em development ou staging (ambiente atual: "${target || 'indefinido'}"). Nada foi criado.`);
  }
}

/** Idempotente: usuários já existentes são atualizados com os dados do seed sem criar duplicidades. */
export async function runSeed(client, { log = console.log } = {}) {
  let created = 0;
  for (const user of SEED_USERS) {
    const senhaHash = await password.hashPassword(SEED_PASSWORD);
    const { rows } = await client.query(
      `INSERT INTO users (id, nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
       RETURNING (xmax = 0) AS inserted`,
      [user.id, user.nome, user.email, senhaHash, user.papel],
    );
    if (rows[0]?.inserted) created += 1;
  }
  log(`Seeds: ${created} usuário(s) criado(s), ${SEED_USERS.length - created} já existente(s).`);
  return created;
}

async function main() {
  assertSeedAllowed();
  const client = new pg.Client(connection.getConnectionConfig());
  await client.connect();
  try {
    await runSeed(client);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Erro: ${error.message}`);
    if (error.code === '28P01' || error.code === 'ECONNREFUSED') console.error(`Conexão usada: ${connection.describeConnection()}`);
    process.exit(1);
  });
}
