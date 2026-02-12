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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ 
        backgroundColor: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
      }}>
        {children}
      </body>
    </html>
  )
}
