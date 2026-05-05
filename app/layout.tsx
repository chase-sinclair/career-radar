import type { Metadata } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono, DM_Mono } from 'next/font/google';
import NavLinks from '@/components/NavLinks';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const editorial = Cormorant_Garamond({
  variable: '--font-editorial',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Career Radar - Labor Market Intelligence',
  description:
    'Track how roles, skills, tools, and hiring demand are changing across the AI-era labor market.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dmMono.variable} ${editorial.variable} h-full antialiased`}
    >
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="app-header">
          <div className="brand-lockup" aria-label="Career Radar">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">Career Radar</span>
          </div>

          <NavLinks />
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
