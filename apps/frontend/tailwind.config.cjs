module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        raised: "var(--bg-raised)",
        hover: "var(--bg-hover)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        dim: "var(--text-dim)",
      },
      borderColor: {
        dim: "var(--border-dim)",
        mid: "var(--border-mid)",
        glow: "var(--border-glow)",
      },
    },
  },
  plugins: [],
};

