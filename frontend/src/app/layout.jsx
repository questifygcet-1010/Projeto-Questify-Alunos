import { DM_Sans, Sora } from 'next/font/google';
import './styles/tokens.css';
import './styles/globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Questify', template: '%s · Questify' },
  description: 'Plataforma gamificada de produtividade acadêmica.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
