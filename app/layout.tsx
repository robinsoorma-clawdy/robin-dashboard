import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Robin's Mission Control",
  description: 'Track tasks, projects, and daily activities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ 
        backgroundColor: '#0d1117', 
        color: '#c9d1d9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {children}
      </body>
    </html>
  )
}
