import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
  className?: string;
}

export function Header({ showNav = true, className }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm ${className || ''}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center">
            <span className="text-2xl">◉</span>
          </div>
          <div>
            <h1 className="font-arcade text-xs tracking-wider group-hover:text-neon-cyan transition-colors">
              METRO MINUTE
            </h1>
            <p className="text-xs text-retro-muted font-terminal">
              Arcade Hub
            </p>
          </div>
        </Link>

        {/* Navigation */}
        {showNav && (
          <nav className="flex items-center gap-6">
            <Link
              href="/leaderboard"
              className="font-terminal text-sm text-retro-muted hover:text-retro-text transition-colors"
            >
              LEADERBOARD
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
