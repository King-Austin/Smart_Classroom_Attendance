/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base palette (dark-first, matching original dark theme)
        background: "#0E0E12",
        foreground: "#EEF0F4",
        card: "#14141C",
        "card-foreground": "#EEF0F4",
        primary: "#5B6FD4",
        "primary-foreground": "#FFFFFF",
        secondary: "#1E1E2A",
        "secondary-foreground": "#EEF0F4",
        muted: "#1E1E2A",
        "muted-foreground": "#8A8FA8",
        // Electric Cyan accent (core brand colour)
        accent: "#00E5FF",
        "accent-foreground": "#0E0E12",
        // Neon purple secondary accent
        purple: "#9B59B6",
        destructive: "#EF4444",
        "destructive-foreground": "#FFFFFF",
        success: "#24B075",
        "success-foreground": "#FFFFFF",
        warning: "#F59E0B",
        "warning-foreground": "#0E0E12",
        border: "#2A2A38",
        input: "#2A2A38",
        ring: "#00E5FF",
      },
      fontFamily: {
        heading: ["SpaceGrotesk", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
