import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { HealthBadge } from '@/components/health/HealthBadge';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Arb Platform | Market Intelligence',
  description: 'Arbitrage detection and market intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${instrumentSans.variable} ${jetbrainsMono.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <HealthBadge />
        </div>
      </body>
    </html>
  );
}

