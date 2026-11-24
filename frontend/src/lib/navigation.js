import {
  BagIcon,
  BellIcon,
  GearIcon,
  HomeIcon,
  InfoIcon,
  TrendingIcon,
  TrophyIcon,
  UserIcon,
} from '@/components/icons';

/** Links da navbar desktop e primeiros itens do menu mobile (rótulos como no Figma). */
export const PRIMARY_LINKS = [
  { href: '/', label: 'Início', mobileLabel: 'Início', Icon: HomeIcon },
  { href: '/progresso', label: 'Meu Progresso', mobileLabel: 'Meu progresso', Icon: TrendingIcon },
  { href: '/ranking', label: 'Ranking', mobileLabel: 'Ranking', Icon: TrophyIcon },
  { href: '/loja', label: 'Loja', mobileLabel: 'Loja', Icon: BagIcon },
];

/** Itens do Menu da conta (desktop). */
export const ACCOUNT_LINKS = [
  { href: '/perfil', label: 'Meu perfil', Icon: UserIcon },
  { href: '/configuracoes', label: 'Configurações', Icon: GearIcon },
  { href: '/sobre', label: 'Sobre o projeto', Icon: InfoIcon },
];

/** Itens do menu mobile (frame 5:182): principais + Notificações + itens da conta. */
export const MOBILE_LINKS = [
  ...PRIMARY_LINKS.map(({ href, mobileLabel, Icon }) => ({ href, label: mobileLabel, Icon })),
  { href: '/notificacoes', label: 'Notificações', Icon: BellIcon },
  ...ACCOUNT_LINKS,
];

export function isActivePath(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
