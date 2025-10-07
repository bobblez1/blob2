/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blob-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(20px, -30px) scale(1.1)" },
          "50%": { transform: "translate(-15px, 25px) scale(0.9)" },
          "75%": { transform: "translate(10px, -10px) scale(1.05)" },
        },
        "blob-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "30%": { transform: "translate(-25px, 15px) scale(1.2)" },
          "60%": { transform: "translate(20px, -20px) scale(0.95)" },
          "90%": { transform: "translate(-10px, 5px) scale(1.1)" },
        },
        "blob-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "40%": { transform: "translate(10px, 30px) scale(0.8)" },
          "70%": { transform: "translate(-20px, -10px) scale(1.15)" },
        },
        "blob-4": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "35%": { transform: "translate(-10px, -20px) scale(1.05)" },
          "65%": { transform: "translate(15px, 10px) scale(0.9)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "blob-1": "blob-1 15s ease-in-out infinite alternate",
        "blob-2": "blob-2 18s ease-in-out infinite alternate-reverse",
        "blob-3": "blob-3 12s ease-in-out infinite alternate",
        "blob-4": "blob-4 20s ease-in-out infinite alternate-reverse",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};