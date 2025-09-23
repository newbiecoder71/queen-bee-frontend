/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "rabbit-blue": "#025bff",
        "purple-fill": "#6B21A8", // Tailwind text-purple-900 equivalent
      },
      textShadow: {
        sm: "1px 1px 2px rgba(0,0,0,0.4)",
        md: "2px 2px 4px rgba(0,0,0,0.5)",
        lg: "3px 3px 6px rgba(0,0,0,0.6)",
        glow: "0 0 6px rgba(128,0,128,0.8), 0 0 12px rgba(75,0,130,0.6), 0 0 24px rgba(75,0,130,0.4)",
        emboss: "1px 1px 0 #b8860b, 2px 2px 2px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [
    // Text shadows
    function ({ addUtilities, theme }) {
      const shadows = theme("textShadow");
      const newUtilities = Object.entries(shadows).map(([key, value]) => {
        return [`.text-shadow-${key}`, { textShadow: value }];
      });
      addUtilities(Object.fromEntries(newUtilities));
    },

    // Text outlines
    function ({ addUtilities }) {
      const newUtilities = {
        // Basic black outlines
        ".text-outline": {
          "-webkit-text-stroke": "1px black",
          "color": "#000000",
          "paint-order": "stroke fill",
        },
        ".text-outline-2": {
          "-webkit-text-stroke": "2px black",
          "color": "#000000",
          "paint-order": "stroke fill",
        },

        // Gold outlines
        ".text-outline-gold": {
          "-webkit-text-stroke": "2px #DAA520", // standard gold
          "color": "#6B21A8", // purple fill
          "paint-order": "stroke fill",
        },
        ".text-outline-gold-lg": {
          "-webkit-text-stroke": "4px #DAA520", // thicker gold for headers
          "color": "#6B21A8",
          "paint-order": "stroke fill",
        },
        ".text-outline-gold-rounded": {
          "-webkit-text-stroke": "3px #DAA520",
          "color": "#6B21A8",
          "paint-order": "stroke fill",
          // optional: smoother edges via layered text-shadow
          "text-shadow": `
            1px 1px 0 #DAA520,
            -1px 1px 0 #DAA520,
            1px -1px 0 #DAA520,
            -1px -1px 0 #DAA520
          `,
        },

        // Optional: metallic gradient gold (stroke + transparent gradient fill)
        ".text-outline-metallic-gold": {
          "-webkit-text-stroke": "3px #FFD700",
          "paint-order": "stroke fill",
          "color": "#6B21A8", // keep purple fill
          "background": "linear-gradient(90deg, #FFD700, #FFA500, #FFD700)",
          "-webkit-background-clip": "text",
        },
        ".text-outline-gold-hero": {
          "-webkit-text-stroke": "6px #FFC107", // wide gold stroke
          "color": "#6B21A8",                  // purple fill
          "paint-order": "stroke fill",
          "text-shadow": `
            1px 1px 0 #FFC107,
            -1px 1px 0 #FFC107,
            1px -1px 0 #FFC107,
            -1px -1px 0 #FFC107
          `, // optional for slightly smoother edges
        },
        ".text-outline-tan-hero": {
          "-webkit-text-stroke": "6px #D2B48C", // tan outline
          "color": "#6B21A8",                  // purple fill
          "paint-order": "stroke fill",
          "text-shadow": `
            1px 1px 0 #D2B48C,
            -1px 1px 0 #D2B48C,
            1px -1px 0 #D2B48C,
            -1px -1px 0 #D2B48C
          `, // optional: smooth edges
        },
      };
      addUtilities(newUtilities);
    },
  ],
};