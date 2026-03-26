export interface Game {
  id: string;
  title: string;
  icon: string | React.ComponentType<{ className?: string }>;
  description: string;
  href: string;
  available: boolean;
  accentColor?: string;
  tags?: string[];
}

export type NeonColor = 'cyan' | 'magenta' | 'yellow' | 'green';
