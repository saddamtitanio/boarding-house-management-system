import './global.css'
import { Poppins } from 'next/font/google'
import { ToastProvider } from '@sbhms/ui'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}