import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

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
    <html lang="en" data-vibe="luxury">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Luxury: Playfair Display + DM Sans */}
        {/* Brutalist: Space Mono */}
        {/* Retro: VT323 + Share Tech Mono */}
        {/* Organic: Lora + Inter */}
        {/* Swiss: Inter (shared with Organic) */}
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&family=Share+Tech+Mono&family=Space+Mono:wght@400;700&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ 
        backgroundColor: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
      }}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
