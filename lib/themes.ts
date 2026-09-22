export type Theme = {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  glow: string;
  /** Light themes skip the scanlines, which only wash them grey. */
  light?: boolean;
};

// `dim` carries most of the secondary text, so every value here clears roughly
// 4.5:1 against its own background rather than fading into it.
export const themes: Theme[] = [
  { name: "phosphor", bg: "#04120a", fg: "#7cf9a6", accent: "#c6ffd9", dim: "#5aa876", glow: "124,249,166" },
  { name: "amber",    bg: "#120b02", fg: "#ffc75c", accent: "#ffe4ab", dim: "#b78e42", glow: "255,199,92"  },
  { name: "ice",      bg: "#04101a", fg: "#8fdcff", accent: "#d4f2ff", dim: "#6a9db8", glow: "143,220,255" },
  { name: "matrix",   bg: "#000000", fg: "#3dff70", accent: "#c8ffd8", dim: "#4f9e69", glow: "61,255,112"  },
  { name: "vapor",    bg: "#150425", fg: "#ff9fee", accent: "#ffd9f7", dim: "#b072a6", glow: "255,159,238" },
  { name: "paper",    bg: "#f5f2ea", fg: "#23231f", accent: "#8a2020", dim: "#6b6759", glow: "35,35,31", light: true },
];

export const defaultTheme = themes[0];
