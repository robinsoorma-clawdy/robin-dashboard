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
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      padding: '48px 32px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient gold gradient */}
      <div style={{
        position: 'absolute',
        top: '-80%',
        left: '20%',
        width: '500px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(201, 168, 76, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Geometric accent — top-right corner */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '32px',
        width: '60px',
        height: '60px',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40px',
          height: '1px',
          background: 'var(--accent)',
          opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '40px',
          background: 'var(--accent)',
          opacity: 0.3,
        }} />
      </div>

      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Left: Asymmetric editorial layout */}
        <div>
          {/* Eyebrow */}
          <p style={{ 
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '12px',
          }}>
            Mission Control
          </p>
          
          <h1 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 48px)', 
            fontWeight: 400, 
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            marginBottom: '0',
          }}>
            Robin
          </h1>

          {/* Gold divider line */}
          <div style={{
            width: '48px',
            height: '1px',
            background: 'var(--accent)',
            marginTop: '16px',
            opacity: 0.6,
          }} />
        </div>

        {/* Right: Date & metadata */}
        <div style={{
          textAlign: 'right',
          paddingBottom: '4px',
        }}>
          <p style={{ 
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            {dateStr}
          </p>
        </div>
      </div>
    </header>
  )
}
