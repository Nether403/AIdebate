import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/layout/Navigation'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { ToastProvider } from '@/components/layout/Toast'
import { NeuralBackground } from '@/components/layout/NeuralBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LLMargument | AI Debate Workbench',
  description: 'A premium LLM debate benchmarking and alignment-research workbench focused on reliable, inspectable debate artifacts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} relative antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <NeuralBackground />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

