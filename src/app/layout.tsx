import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3111';
  const isLocalHost =
    host.includes('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
  const proto = isLocalHost ? 'http' : 'https';
  const baseUrl = new URL(`${proto}://${host}`);
  const logoUrl = new URL('/logo.jpeg', baseUrl).toString();

  const title = 'Brigada Ambiental International';
  const description =
    'A Brigada Ambiental International atua na prevenção, monitoramento e resposta a ocorrências ambientais. Sistemas digitais desenvolvidos em parceria com a SementeToken.';

  return {
    metadataBase: baseUrl,
    title,
    description,
    applicationName: title,
    icons: {
      icon: '/favicon.ico',
      apple: '/logo.jpeg',
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: title,
      locale: 'pt_BR',
      type: 'website',
      images: [{ url: logoUrl, alt: title, width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [logoUrl],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
