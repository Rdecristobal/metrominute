interface RetroBackgroundProps {
  className?: string;
}

export function RetroBackground({ className }: RetroBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className || ''}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-retro-dark via-black to-retro-dark" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,247,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,247,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
    </div>
  );
}
