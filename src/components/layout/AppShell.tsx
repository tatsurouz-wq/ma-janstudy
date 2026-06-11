import { Link, Outlet } from 'react-router'

export function AppShell() {
  return (
    <div className="min-h-screen bg-ink-950">
      <header className="flex h-14 items-center justify-between border-b border-gold-line bg-ink-900 px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-mincho text-2xl font-bold tracking-widest text-gold-500">
            雀学
          </span>
          <span className="text-xs text-text-secondary">
            麻雀ルールと点数計算を学ぶ
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-secondary">
          <Link to="/" className="transition-colors hover:text-gold-300">
            ホーム
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
