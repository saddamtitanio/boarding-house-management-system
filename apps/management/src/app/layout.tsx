import './global.css'
import { Poppins } from 'next/font/google';
import AppShell from './AppShell';
import { ToastProvider } from '@sbhms/ui';
import { LanguageProvider } from '@/src/contexts/LanguageContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans`}>
        <LanguageProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}