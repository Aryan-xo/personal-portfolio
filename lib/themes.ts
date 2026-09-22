export type Theme = {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  glow: string;
};

export const themes: Theme[] = [
  { name: "phosphor", bg: "#020a02", fg: "#33ff66", accent: "#8affb0", dim: "#1f7a3d", glow: "51,255,102" },
  { name: "amber",    bg: "#0d0700", fg: "#ffb000", accent: "#ffd580", dim: "#8a5f00", glow: "255,176,0"  },
  { name: "ice",      bg: "#000810", fg: "#5ad4ff", accent: "#b3ecff", dim: "#1e6f8f", glow: "90,212,255" },
  { name: "matrix",   bg: "#000000", fg: "#00ff41", accent: "#b6ffc8", dim: "#0a7a24", glow: "0,255,65"   },
  { name: "vapor",    bg: "#12021c", fg: "#ff77e9", accent: "#ffc4f4", dim: "#8a2f7c", glow: "255,119,233"},
  { name: "paper",    bg: "#f4f1e8", fg: "#2b2b28", accent: "#7a1f1f", dim: "#8f8a7c", glow: "43,43,40"   },
];

export const defaultTheme = themes[0];
