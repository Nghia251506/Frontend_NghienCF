export type ThemeDto = {
  primaryColor: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  navbar: string;
  buttonFrom?: string;
  buttonTo?: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
};

const hexToRgb = (hex: string) => {
  if (!hex) return "0 0 0";
  const s = hex.replace("#", "");
  const v = s.length === 3 ? s.split("").map(c=>c+c).join("") : s;
  const n = parseInt(v, 16);
  return `${(n>>16)&255} ${(n>>8)&255} ${n&255}`;
};

export function applyTheme(t: ThemeDto, doc: Document = document) {
  const root = doc.documentElement;
  root.style.setProperty("--color-primary", hexToRgb(t.primaryColor));
  root.style.setProperty("--color-accent",  hexToRgb(t.accent));
  root.style.setProperty("--color-bg",      hexToRgb(t.background));
  root.style.setProperty("--color-surface", hexToRgb(t.surface));
  root.style.setProperty("--color-text",    hexToRgb(t.text));
  root.style.setProperty("--color-muted",   hexToRgb(t.muted));
  root.style.setProperty("--color-navbar",  hexToRgb(t.navbar));
  root.style.setProperty("--scrollbar-thumb", t.scrollbarThumb);
  root.style.setProperty("--scrollbar-track", t.scrollbarTrack);
}