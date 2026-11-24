// Regras do nome da guilda, reaproveitadas do antigo src/guilds.jsx:
// normaliza (NFC, espaços colapsados, trim) e exige 3 a 30 caracteres,
// contando code points (Array.from), não unidades UTF-16.

export const GUILD_NAME_MIN = 3;
export const GUILD_NAME_MAX = 30;

export const normalizeGuildName = (value) => value.normalize('NFC').replace(/\s+/g, ' ').trim();

export function guildNameLength(value) {
  return Array.from(normalizeGuildName(value)).length;
}

export function isValidGuildName(value) {
  const length = guildNameLength(value);
  return length >= GUILD_NAME_MIN && length <= GUILD_NAME_MAX;
}
