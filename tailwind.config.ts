import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f7f5ef",
        graphite: "#3f4b55",
        signal: "#0f766e",
        amberline: "#b7791f"
      },
      boxShadow: {
        subtle: "0 16px 40px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
