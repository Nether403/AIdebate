import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/layout/Navigation'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { ToastProvider } from '@/components/layout/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Debate Workbench',
  description: 'A lean LLM debate benchmarking and alignment-research workbench focused on reliable, inspectable debate artifacts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <Navigation />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
