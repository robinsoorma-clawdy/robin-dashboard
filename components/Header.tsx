export default function Header() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header style={{ 
      background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      borderBottom: '1px solid var(--border)',
      padding: '40px 24px 36px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle ambient glow behind header */}
      <div style={{
        position: 'absolute',
        top: '-60%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse, rgba(56, 139, 253, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 0 20px rgba(56, 139, 253, 0.2)',
          }}>
            🎯
          </div>
          
          <div>
            <h1 style={{ 
              fontSize: 'clamp(24px, 5vw, 34px)', 
              fontWeight: 800, 
              background: 'var(--gradient-brand)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              animation: 'gradientFlow 6s ease infinite',
            }}>
              Robin&apos;s Mission Control
            </h1>
          </div>
        </div>
        
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginBottom: '6px',
          letterSpacing: '0.01em',
          fontWeight: 400,
        }}>
          Track tasks, projects, and daily activities
        </p>
        
        <p style={{ 
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {dateStr}
        </p>
      </div>
    </header>
  )
}
