/** Normaliza para busca: sem acentos e sem diferenciar maiúsculas/minúsculas. */
export function normalizeSearch(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Guildas cujo nome ou categoria contém o termo (ignorando acentos e caixa). */
export function filterGuilds(guilds, query) {
  const term = normalizeSearch(query);
  if (!term) return guilds;
  return guilds.filter(
    (guild) => normalizeSearch(guild.name).includes(term) || normalizeSearch(guild.category).includes(term),
  );
}
