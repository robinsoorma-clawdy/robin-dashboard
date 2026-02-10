export default function Header() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="text-center py-8 border-b border-[var(--border)]">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
        🎯 Robin&apos;s Mission Control
      </h1>
      <p className="text-text-secondary">Track tasks, projects, and daily activities</p>
      <p className="text-text-secondary text-sm mt-2">{dateStr}</p>
    </header>
  )
}
