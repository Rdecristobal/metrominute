import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={`border-t border-gray-800 py-8 mt-16 ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-retro-muted">
          <p className="font-terminal">
            © 2026 Metro Minute. Built with ❤️ by DYZINK.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/Rdecristobal/metrominute"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-retro-text transition-colors font-terminal"
            >
              GITHUB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
