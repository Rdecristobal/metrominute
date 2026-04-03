import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
  className?: string;
}

export function Header({ showNav = true, className }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm ${className || ''}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* DYZINK Logo - Links to dyzink.com */}
        <a href="https://dyzink.com" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">DY</span>
          </div>
          <div>
            <h1 className="font-arcade text-xs tracking-wider group-hover:text-neon-cyan transition-colors">
              DYZINK
            </h1>
            <p className="text-xs text-retro-muted font-terminal">
              MVP Studio
            </p>
          </div>
        </a>

        {/* Navigation */}
        {showNav && (
          <nav className="flex items-center gap-6">
            <a
              href="https://dyzink.com/projects"
              className="font-terminal text-sm text-retro-muted hover:text-retro-text transition-colors"
            >
              Proyectos
            </a>
            <a
              href="https://dyzink.com/build"
              className="font-terminal text-sm text-retro-muted hover:text-retro-text transition-colors"
            >
              Build
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
