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
        // Brandbook — Municipalidad de Salta
        'azul-salta': '#2859AA',
        'azul-vivo': '#015CB4',
        'azul-noche': '#15326F',
        'celeste': '#7FB5FF',
        'tinta': '#15181F',
        'gris-muni': '#686868',
        'hueso': '#F4F2EE',
        // Alias para compatibilidad con código existente
        municipal: {
          50:  '#f0f6ff',
          100: '#ddeaff',
          200: '#bdd4ff',
          300: '#7FB5FF', // celeste
          400: '#4d8de8',
          500: '#2859AA', // azul-salta
          600: '#015CB4', // azul-vivo
          700: '#15326F', // azul-noche
          800: '#0f2454',
          900: '#0a1a3d',
          950: '#060e24',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
