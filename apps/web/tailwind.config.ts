import type { Config } from 'tailwindcss'

// Brand tokens — dark-mode-first, EcoCharge green as the single accent.
// Kept intentionally minimal at this stage: this is the app shell and
// routing scaffold, not the final dashboard visual design (that's a
// dedicated design pass once real dashboard content exists per phase).
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0f0d',
          900: '#0f1613',
          800: '#161f1b',
        },
        accent: {
          DEFAULT: '#2fd67a',
          muted: '#1a8f52',
        },
      },
    },
  },
  plugins: [],
}
export default config
