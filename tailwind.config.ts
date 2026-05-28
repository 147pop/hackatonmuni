import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        municipal: {
          ink: "#172033",
          muted: "#596579",
          line: "#d8dee8",
          surface: "#f6f8fb",
          panel: "#ffffff",
          action: "#0f6b63",
          actionStrong: "#0a4d47",
          warning: "#b45309",
          danger: "#b42318"
        }
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23, 32, 51, 0.08), 0 8px 24px rgba(23, 32, 51, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
