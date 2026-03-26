import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Game } from '@/types/game';

interface GameCardProps extends Game {
  className?: string;
}

export function GameCard({
  id,
  title,
  icon,
  description,
  href,
  available = true,
  accentColor = 'var(--neon-cyan)',
  tags,
  className
}: GameCardProps) {
  // Render icon based on type
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return icon;
    }
    const Icon = icon;
    return <Icon className="w-12 h-12" />;
  };

  return (
    <article className="group relative">
      <Link
        href={available ? href : '#'}
        className={`block p-6 rounded-lg border-2 transition-all duration-300 bg-retro-surface ${
          available
            ? 'border-gray-800 hover:border-neon-cyan hover:shadow-neon-cyan hover:-translate-y-1 cursor-pointer'
            : 'border-gray-900 opacity-50 cursor-not-allowed pointer-events-none'
        }`}
        style={available ? { '--accent': accentColor } as React.CSSProperties : {}}
      >
        {/* Icon */}
        <div className="text-5xl mb-4">
          {renderIcon()}
        </div>

        {/* Title */}
        <h3 className="font-arcade text-sm mb-2 text-retro-text group-hover:text-neon-cyan transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="font-terminal text-base text-retro-muted mb-4">
          {description}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-gray-800 rounded font-terminal text-retro-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2 text-sm font-terminal">
          {available ? (
            <>
              <span className="text-neon-cyan">PLAY</span>
              <ArrowRight className="w-4 h-4 text-neon-cyan group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <span className="text-retro-muted">COMING SOON</span>
          )}
        </div>
      </Link>
    </article>
  );
}
