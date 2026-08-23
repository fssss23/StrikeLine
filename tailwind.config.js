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
          navyDeep: '#08203C',
          blue: '#2563EB',
          blueLight: '#3B82F6',
          blueSoft: '#EFF4FF',
        },
        surface: {
          page: '#F8F9FB',
          card: '#FFFFFF',
          border: '#E4E7ED',
          hairline: '#EDF0F5',
          muted: '#F1F5F9',
          sunken: '#F4F6F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          tertiary: '#94A3B8',
          inverse: '#FFFFFF',
        },
        signal: {
          green: '#16A34A',
          greenBg: '#F0FDF4',
          greenRing: 'rgba(22,163,74,0.16)',
          red: '#DC2626',
          redBg: '#FEF2F2',
          redRing: 'rgba(220,38,38,0.16)',
          amber: '#D97706',
          amberBg: '#FFFBEB',
          amberRing: 'rgba(217,119,6,0.16)',
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
        '3xl': ['30px', '38px'],
        'price-sm': ['22px', '28px'],
        'price-lg': ['32px', '40px'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
        tightish: '-0.011em',
      },
      borderRadius: {
        card: '12px',
        xcard: '16px',
        panel: '20px',
        input: '8px',
        pill: '999px',
        sm: '6px',
      },
      boxShadow: {
        // Layered, low-opacity shadows — the depth cue that separates a
        // "premium" surface from a flat bordered box.
        hairline: '0 0 0 1px rgba(15,23,42,0.05)',
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.05)',
        raised: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -2px rgba(15,23,42,0.07)',
        lifted: '0 2px 4px rgba(15,23,42,0.04), 0 12px 24px -6px rgba(15,23,42,0.10)',
        drawer: '0 24px 64px -12px rgba(8,32,60,0.22), 0 8px 20px -8px rgba(8,32,60,0.14)',
        pillnav: '0 8px 28px -6px rgba(8,32,60,0.20), 0 2px 8px -2px rgba(8,32,60,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
        cta: '0 1px 2px rgba(37,99,235,0.24), 0 6px 16px -4px rgba(37,99,235,0.36)',
        ctaNavy: '0 1px 2px rgba(13,47,85,0.24), 0 6px 16px -4px rgba(13,47,85,0.32)',
        focus: '0 0 0 3px rgba(37,99,235,0.18)',
        inset: 'inset 0 1px 2px rgba(15,23,42,0.05)',
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(168deg, #0D2F55 0%, #0A2647 55%, #08203C 100%)',
        'blue-gradient': 'linear-gradient(135deg, #2F6FE4 0%, #2563EB 100%)',
        'sheen': 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        swift: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        // `backwards` (never `both`): a retained `transform: translateY(0)`
        // would turn the animated element into the containing block for any
        // position:fixed descendant — which silently breaks modals and the
        // settings save bar rendered inside a page.
        'fade-up': 'fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'fade-in': 'fade-in 260ms ease-out backwards',
        'scale-in': 'scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        marquee: 'marquee 40s linear infinite',
      },
      zIndex: {
        nav: '45',
        drawer: '60',
        modal: '70',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.tabular-nums': { 'font-variant-numeric': 'tabular-nums' },
        // iOS notch / home-indicator aware spacing. `pb-safe` was referenced by
        // the old MobileNav but never defined — the floating pill nav depends
        // on these being real.
        '.pt-safe': { 'padding-top': 'env(safe-area-inset-top, 0px)' },
        '.pb-safe': { 'padding-bottom': 'env(safe-area-inset-bottom, 0px)' },
        '.pl-safe': { 'padding-left': 'env(safe-area-inset-left, 0px)' },
        '.pr-safe': { 'padding-right': 'env(safe-area-inset-right, 0px)' },
        '.mb-safe': { 'margin-bottom': 'env(safe-area-inset-bottom, 0px)' },
        '.bottom-safe': { bottom: 'env(safe-area-inset-bottom, 0px)' },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': { display: 'none' },
        '.tap-none': { '-webkit-tap-highlight-color': 'transparent' },
        '.scroll-touch': { '-webkit-overflow-scrolling': 'touch' },
        '.overscroll-none-y': { 'overscroll-behavior-y': 'contain' },
      })
    })
  ]
}
