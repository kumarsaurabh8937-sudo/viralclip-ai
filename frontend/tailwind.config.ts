import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'base-bg':       '#121212',
        'surface':       '#1E1E1E',
        'surface-raised':'#2A2A2A',
        'surface-border':'#333333',
        'text-primary':  '#F9FAFB',
        'text-secondary':'#D1D5DB',
        'text-muted':    '#6B7280',
        'neon-purple':   '#A855F7',
        'neon-purple-dark': '#7C3AED',
        'neon-blue':     '#3B82F6',
        'neon-blue-dark':'#2563EB',
        'neon-pink':     '#EC4899',
        'neon-cyan':     '#06B6D4',
        'neon-green':    '#10B981',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-blue':   '0 0 20px rgba(59, 130, 246, 0.5)',
        'neon-pink':   '0 0 20px rgba(236, 72, 153, 0.5)',
        'neon-green':  '0 0 20px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #A855F7, #3B82F6)',
        'gradient-dark': 'linear-gradient(135deg, #1E1E1E, #121212)',
        'hero-glow':     'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
