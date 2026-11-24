import GuildDetail from '@/components/GuildDetail/GuildDetail';

// Export estático: gera uma única página (guilds/_.html). O vercel.json e o
// backend/server.js reescrevem /guilds/<id> para ela, e o componente lê o id da URL.
export function generateStaticParams() {
  return [{ id: '_' }];
}

export const metadata = { title: 'Guilda' };

export default function GuildDetailPage() {
  return <GuildDetail />;
}
