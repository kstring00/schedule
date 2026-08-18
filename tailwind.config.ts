import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        velvet: "#120E18",
        nebula: "#3B2A3F",
        smoky: "#7A6D7F",
        solar: "#E07A2E",
        ember: "#F4A883",
        stardust: "#F6ECDD",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(224,122,46,.25), 0 14px 40px rgba(0,0,0,.28)",
      },
    },
  },
  plugins: [],
};

export default config;
