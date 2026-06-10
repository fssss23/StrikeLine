import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0D2F55',
          navyLight: '#1A4A7A',
          blue: '#2563EB',
        },
        surface: {
          page: '#F8F9FB',
          card: '#FFFFFF',
          border: '#E4E7ED',
          muted: '#F1F5F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          inverse: '#FFFFFF',
        },
        signal: {
          green: '#16A34A',
          greenBg: '#F0FDF4',
          red: '#DC2626',
          redBg: '#FEF2F2',
          amber: '#D97706',
          amberBg: '#FFFBEB',
        },
        sidebar: {
          bg: '#0D2F55',
          textActive: '#FFFFFF',
          textInactive: '#94A3B8',
          hover: 'rgba(255,255,255,0.06)',
          activeBg: 'rgba(255,255,255,0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '20px'],
        md: ['15px', '22px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        'price-sm': ['22px', '28px'],
        'price-lg': ['32px', '40px'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '999px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        drawer: '0 20px 60px rgba(0,0,0,0.12)',
        focus: '0 0 0 2px #2563EB',
      }
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({ '.tabular-nums': { 'font-variant-numeric': 'tabular-nums' } })
    })
  ]
}
