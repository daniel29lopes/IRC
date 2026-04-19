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
        status: {
          pendente: "#eab308", // yellow-500
          corte: "#3b82f6",    // blue-500
          montagem: "#a855f7", // purple-500
          hold: "#f97316",     // orange-500
          concluido: "#059669",// emerald-600
          erro: "#dc2626",     // red-600
        },
        action: {
          aprovar: "#059669",  // emerald-600
          cortar: "#dc2626",   // red-600
        }
      },
    },
  },
  plugins: [],
};
export default config;
