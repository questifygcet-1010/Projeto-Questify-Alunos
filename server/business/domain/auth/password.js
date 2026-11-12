const { pbkdf2, randomBytes, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 310_000;

/** Gera `pbkdf2_sha256$iterações$salt$hash`. Nunca persistir a senha em texto puro. */
async function hashPassword(password, salt = randomBytes(16)) {
  const digest = await pbkdf2Async(password, salt, ITERATIONS, 32, 'sha256');
  return `pbkdf2_sha256$${ITERATIONS}$${salt.toString('hex')}$${digest.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  try {
    const [algorithm, rounds, saltHex, expectedHex] = String(stored).split('$');
    if (algorithm !== 'pbkdf2_sha256') return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = await pbkdf2Async(password, Buffer.from(saltHex, 'hex'), Number(rounds), expected.length, 'sha256');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
