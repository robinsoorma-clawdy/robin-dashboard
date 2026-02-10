export default function Header() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header style={{ textAlign: 'center', padding: '32px 0', borderBottom: '1px solid #30363d' }}>
      <h1 style={{ 
        fontSize: '2.25rem', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        background: 'linear-gradient(90deg, #58a6ff, #a371f7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        🎯 Robin&apos;s Mission Control
      </h1>
      <p style={{ color: '#8b949e' }}>Track tasks, projects, and daily activities</p>
      <p style={{ color: '#8b949e', fontSize: '0.875rem', marginTop: '8px' }}>{dateStr}</p>
    </header>
  )
}
