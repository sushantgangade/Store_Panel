import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Store Panel',
    description: 'Store management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                {/* ToastProvider is now inside <Providers> */}
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}