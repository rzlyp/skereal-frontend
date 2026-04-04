/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design spec colors
        primary: '#2563EB',       // Blue - buttons, active states, selection borders
        secondary: '#64748B',     // Slate - secondary text, icons
        surface: '#FFFFFF',       // Cards, modals
        success: '#10B981',       // Emerald - success states
        loading: '#8B5CF6',       // Violet - processing indicators
      },
      backgroundColor: {
        page: '#F8FAFC',          // Slate-50 - page backgrounds
      },
      textColor: {
        base: '#1E293B',          // Slate-800 - primary text
      },
      aspectRatio: {
        'banner': '2.7 / 1',     // 1308px x 484px image display
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
