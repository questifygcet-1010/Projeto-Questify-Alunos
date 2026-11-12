import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSeedAllowed } from '../../../database/scripts/seed.mjs';

test('seeds permitidos em development e staging', () => {
  assert.doesNotThrow(() => assertSeedAllowed({ NODE_ENV: 'development' }));
  assert.doesNotThrow(() => assertSeedAllowed({ NODE_ENV: 'production', APP_ENV: 'staging' }));
});

test('seeds recusados em produção ou ambiente indefinido', () => {
  assert.throws(() => assertSeedAllowed({ NODE_ENV: 'production' }), /apenas em development ou staging/);
  assert.throws(() => assertSeedAllowed({}), /apenas em development ou staging/);
  assert.throws(() => assertSeedAllowed({ NODE_ENV: 'development', VERCEL_ENV: 'production' }));
  assert.throws(() => assertSeedAllowed({ NODE_ENV: 'development', APP_ENV: 'production' }));
});
