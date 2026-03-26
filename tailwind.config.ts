import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // Retro colors
        'retro-black': '#000000',
        'retro-dark': '#0a0a0a',
        'retro-surface': '#1a1a1a',
        'retro-text': '#e0e0e0',
        'retro-muted': '#888888',

        'neon-cyan': '#00fff7',
        'neon-magenta': '#ff00ff',
        'neon-yellow': '#ffff00',
        'neon-green': '#39ff14',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) * 0.6)",
        sm: "calc(var(--radius) * 0.4)",
      },
      fontFamily: {
        'arcade': ['"Press Start 2P"', 'cursive'],
        'terminal': ['VT323', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00fff7, 0 0 10px #00fff7, 0 0 20px #00fff7',
        'neon-magenta': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 20px #39ff14',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
