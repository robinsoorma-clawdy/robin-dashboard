'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Vibe = 'luxury' | 'brutalist' | 'retro' | 'organic' | 'swiss'

export const VIBES: { id: Vibe; label: string; description: string; icon: string }[] = [
  { id: 'luxury',    label: 'Luxury',    description: 'Obsidian & Gold',   icon: '\u2666' },
  { id: 'brutalist', label: 'Brutalist', description: 'Raw & Electric',    icon: '\u25A0' },
  { id: 'retro',     label: 'Retro',     description: '80s Sci-Fi',        icon: '\u25C8' },
  { id: 'organic',   label: 'Organic',   description: 'Soft & Natural',    icon: '\u25CB' },
  { id: 'swiss',     label: 'Swiss',     description: 'Hyper-Clean Grid',  icon: '\u002B' },
]

interface VibeContextType {
  vibe: Vibe
  setVibe: (vibe: Vibe) => void
  cycleVibe: () => void
}

const VibeContext = createContext<VibeContextType | undefined>(undefined)

const STORAGE_KEY = 'robin-dashboard-vibe'

export function VibeProvider({ children }: { children: ReactNode }) {
  const [vibe, setVibeState] = useState<Vibe>('luxury')
  const [mounted, setMounted] = useState(false)

  // Load saved vibe on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Vibe | null
      if (saved && VIBES.some(v => v.id === saved)) {
        setVibeState(saved)
      }
    } catch {
      // localStorage not available
    }
    setMounted(true)
  }, [])

  // Apply data-vibe attribute to <html> element
  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-vibe', vibe)
    try {
      localStorage.setItem(STORAGE_KEY, vibe)
    } catch {
      // localStorage not available
    }
  }, [vibe, mounted])

  const setVibe = (newVibe: Vibe) => {
    setVibeState(newVibe)
  }

  const cycleVibe = () => {
    const currentIndex = VIBES.findIndex(v => v.id === vibe)
    const nextIndex = (currentIndex + 1) % VIBES.length
    setVibeState(VIBES[nextIndex].id)
  }

  return (
    <VibeContext.Provider value={{ vibe, setVibe, cycleVibe }}>
      {children}
    </VibeContext.Provider>
  )
}

export function useVibe() {
  const context = useContext(VibeContext)
  if (context === undefined) {
    throw new Error('useVibe must be used within a VibeProvider')
  }
  return context
}
