// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalkProvider } from '@/contexts/WalkContext';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WalkMate',
  description: 'Track your daily walking progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <WalkProvider>
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            {children}
          </main>
        </WalkProvider>
      </body>
    </html>
  );
}