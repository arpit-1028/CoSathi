/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosathi: {
          forest: "#24324A", // Refined primary ink (deep slate navy)
          "forest-dark": "#162031",
          clay: "#A65343", // Warm terracotta / brick accent
          "clay-light": "#C46856",
          ochre: "#C58B2A", // Warm saffron / brass
          parchment: "#F7F4EE", // Authentic warm paper / ivory
          card: "#FFFFFF",
          slate: "#20242A",
          muted: "#636D79",
          border: "#D9D5CC",
          surface: "#F2EFEB"
        },
        ink: {
          DEFAULT: "#24324A",
          dark: "#162031",
          light: "#354766",
        },
        ivory: {
          DEFAULT: "#F7F4EE",
          subtle: "#F1EDE4",
          card: "#FFFFFF",
        },
        brass: {
          DEFAULT: "#C58B2A",
          light: "#DF9F35",
          dark: "#A3711F",
        },
        brick: {
          DEFAULT: "#A65343",
          light: "#BF6654",
          dark: "#8C4334",
        },
        pine: {
          DEFAULT: "#3C5A48",
          light: "#4E735D",
          dark: "#2A4133",
        }
      },
      fontFamily: {
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(36, 50, 74, 0.06), 0 1px 2px rgba(36, 50, 74, 0.04)',
        card: '0 2px 8px rgba(36, 50, 74, 0.06), 0 1px 3px rgba(36, 50, 74, 0.04)',
        elevated: '0 8px 24px rgba(36, 50, 74, 0.09), 0 2px 6px rgba(36, 50, 74, 0.04)',
      }
    },
  },
  plugins: [],
}
