import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: "#1A4F8A",
          50: "#E8EFF8",
          100: "#C5D6EC",
          200: "#98B5D9",
          300: "#6B94C7",
          400: "#3E73B4",
          500: "#1A4F8A",
          600: "#153F6E",
          700: "#0F2F52",
          800: "#0A1F37",
          900: "#051019",
        },
        success: "#0F6E56",
        warning: "#854F0B",
        danger: "#A32D2D",
      },
    },
  },
  plugins: [],
} satisfies Config;
