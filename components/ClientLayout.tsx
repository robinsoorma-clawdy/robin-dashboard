'use client'

import { ReactNode } from 'react'
import { VibeProvider } from '@/lib/vibe-context'
import VibeSwitcher from '@/components/VibeSwitcher'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <VibeProvider>
      {children}
      <VibeSwitcher />
    </VibeProvider>
  )
}
