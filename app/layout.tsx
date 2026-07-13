// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Journal',
  description: 'Journal de scalping personnel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mg">
      <body className="bg-[#0a0a0c] antialiased">
        {children}
      </body>
    </html>
  )
}