import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CondoTrack',
  description: 'Gestão de demandas do condomínio',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a2744',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-[420px] bg-white min-h-screen flex flex-col shadow-sm">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
