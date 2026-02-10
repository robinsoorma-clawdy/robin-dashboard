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
      <body className="bg-bg-primary text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  )
}
