/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'rgb(var(--bg-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          card:      'rgb(var(--bg-card)      / <alpha-value>)',
          hover:     'rgb(var(--bg-hover)     / <alpha-value>)',
        },
        accent: {
          gold:        'rgb(var(--accent-gold)        / <alpha-value>)',
          'gold-light':'rgb(var(--accent-gold-light)  / <alpha-value>)',
          red:         'rgb(var(--accent-red)         / <alpha-value>)',
          blue:        'rgb(var(--accent-blue)        / <alpha-value>)',
          green:       'rgb(var(--accent-green)       / <alpha-value>)',
          purple:      'rgb(var(--accent-purple)      / <alpha-value>)',
        },
        text: {
          primary:   'rgb(var(--text-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--text-muted)     / <alpha-value>)',
        },
        border: {
          default: 'rgb(var(--border-default) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
