/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial da REGIF
        regif: {
          blue: "#113c64", // Azul Principal
          dark: "#16152a", // Títulos / Azul Profundo
          red: "#da2128", // Detalhes / Sair
          green: "#10d431", // Detalhes / Sucesso
        },
      },
      fontFamily: {
        // Define Open Sans como a fonte principal do sistema
        sans: ['"Open Sans"', "sans-serif"],
      },
    },
  },
  plugins: [typography],
};
