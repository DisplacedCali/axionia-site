import type { Config } from "tailwindcss";

// Colors and type scale pulled directly from axionia_brand_tokens.md.
// That file is the canonical source — keep this in sync with it.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: "#2463EB",
        green: "#3CBF6C",
        teal: "#4AC9DC",
        navy: "#1C2431",
        base: "#F8F6F1",
        "base-2": "#F0EDE6",
        border: "#E6E2D9",
        "gray-warm": "#706C63",
        "gray-cool": "#AEB4BC",
        stone: "#DDD9D0",
        "blue-light": "#EEF3FE",
        "green-light": "#EAF7EF",
        "amber-light": "#FBF3E6",
        "red-light": "#FCECEA",
        pos: "#3CBF6C",
        caution: "#9C6B1A",
        risk: "#B03A2E",
        indigo: "#3D4E8F",
        ocean: "#2E8C9E",
        slate: "#5B7095",
        sage: "#7FA86B",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        mono: ["'DM Mono'", "ui-monospace", "monospace"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "axionia-gradient":
          "linear-gradient(135deg, #4AC9DC 0%, #2463EB 70%, #3CBF6C 130%)",
      },
      maxWidth: {
        measure: "580px",
      },
    },
  },
  plugins: [],
};
export default config;
