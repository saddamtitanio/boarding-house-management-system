// These styles apply to every route in the application
import './global.css'
import Sidebar from "@/components/ui/Sidebar";

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans`}>
        <Sidebar role="management" userName="Admin" />
        <main style={{ marginLeft: "220px", flex: 1, padding: "24px" }}>
          {children}
        </main>
      </body>
    </html>
  )
}