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
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '32px 16px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🎯
          </div>
          
          <div>
            <h1 style={{ 
              fontSize: 'clamp(24px, 5vw, 32px)', 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, var(--accent), #a371f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}>
              Robin&apos;s Mission Control
            </h1>
          </div>
        </div>
        
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '15px',
          marginBottom: '8px'
        }}>
          Track tasks, projects, and daily activities
        </p>
        
        <p style={{ 
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 500
        }}>
          {dateStr}
        </p>
      </div>
    </header>
  )
}
