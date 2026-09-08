import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#c8102e', // Official Salim Habib Crimson Red
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        shu: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#dc2626',
          700: '#c8102e', // Salim Habib University Red
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      gridTemplateColumns: {
        'timetable': '100px repeat(6, minmax(180px, 1fr))',
      }
    },
  },
  plugins: [],
};
export default config;
