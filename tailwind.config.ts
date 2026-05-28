import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        municipal: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d2ff',
          300: '#9ab5ff',
          400: '#6b8eff',
          500: '#4063ff',
          600: '#2241f5',
          700: '#1a30e1',
          800: '#1c2cb6',
          900: '#1c2c8f',
          950: '#141c5c',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
