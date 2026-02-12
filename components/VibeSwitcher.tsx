'use client'

import { useState, useEffect, useRef } from 'react'
import { useVibe, VIBES, Vibe } from '@/lib/vibe-context'

// Color swatches for each vibe (used in the switcher UI)
const VIBE_COLORS: Record<Vibe, string[]> = {
  luxury:    ['#c9a84c', '#08080a', '#f0ece2'],
  brutalist: ['#39ff14', '#000000', '#ffffff'],
  retro:     ['#ff00ff', '#0a0014', '#00ffcc'],
  organic:   ['#6b8f71', '#f5f0e8', '#2c2416'],
  swiss:     ['#e20000', '#fafafa', '#0a0a0a'],
}

export default function VibeSwitcher() {
  const { vibe, setVibe } = useVibe()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Keyboard shortcut: V to toggle, 1-5 to select vibe
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }

      if (isOpen && e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1
        if (VIBES[index]) {
          setVibe(VIBES[index].id)
          setIsOpen(false)
        }
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setVibe])

  const currentVibe = VIBES.find(v => v.id === vibe)

  return (
    <>
      {/* Floating trigger button */}
      <button
        ref={triggerRef}
        className="vibe-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch vibe theme"
        title="Switch vibe (V)"
      >
        {/* Color swatch dots */}
        <div style={{
          display: 'flex',
          gap: '3px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {VIBE_COLORS[vibe].map((color, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? '10px' : '6px',
                height: i === 0 ? '10px' : '6px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '1px solid rgba(128, 128, 128, 0.3)',
              }}
            />
          ))}
        </div>
      </button>

      {/* Panel */}
      {isOpen && (
        <div ref={panelRef} className="vibe-switcher-panel">
          <div className="vibe-switcher-header">
            Vibe
          </div>
          
          {VIBES.map((v, index) => (
            <button
              key={v.id}
              className={`vibe-switcher-option ${vibe === v.id ? 'active' : ''}`}
              onClick={() => {
                setVibe(v.id)
                setIsOpen(false)
              }}
            >
              {/* Color swatch */}
              <div style={{
                display: 'flex',
                gap: '2px',
                alignItems: 'center',
              }}>
                {VIBE_COLORS[v.id].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: vibe === v.id ? '50%' : '2px',
                      backgroundColor: color,
                      border: '1px solid rgba(128, 128, 128, 0.2)',
                      transition: 'border-radius 0.2s ease',
                    }}
                  />
                ))}
              </div>

              <div className="vibe-label">
                {v.label}
                <small>{v.description}</small>
              </div>

              <span className="vibe-kbd">{index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
