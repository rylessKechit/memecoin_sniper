import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '🤖 Memecoin Trading Bot',
  description: 'Interface de trading avancée pour memecoins avec backtesting et analyse',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 text-white min-h-screen`}>
        <div className="relative">
          {/* Background Effects */}
          <div className="fixed inset-0 bg-cyber-grid opacity-10 pointer-events-none"></div>
          <div className="fixed inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-600/5 pointer-events-none"></div>
          
          {/* Main Content */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '0.75rem',
              },
              success: {
                iconTheme: {
                  primary: '#00ff88',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff4757',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </body>
    </html>
  )
}