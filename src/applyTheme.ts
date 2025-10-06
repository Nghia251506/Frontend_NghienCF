const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '');
  const bigint = parseInt(m.length === 3 ? m.split('').map(c=>c+c).join('') : m, 16);
  return `${(bigint>>16)&255} ${(bigint>>8)&255} ${bigint&255}`;
};

export type ThemeDto = {
  primaryColor: string; accent: string; background: string; surface: string;
  text: string; muted: string; navbar: string; buttonFrom: string; buttonTo: string;
  scrollbarThumb: string; scrollbarTrack: string;
};

export function applyTheme(dto: ThemeDto) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', hexToRgb(dto.primaryColor));
  root.style.setProperty('--color-accent', hexToRgb(dto.accent));
  root.style.setProperty('--color-bg', hexToRgb(dto.background));
  root.style.setProperty('--color-surface', hexToRgb(dto.surface));
  root.style.setProperty('--color-text', hexToRgb(dto.text));
  root.style.setProperty('--color-muted', hexToRgb(dto.muted));
  root.style.setProperty('--color-navbar', hexToRgb(dto.navbar));
  root.style.setProperty('--scrollbar-thumb', dto.scrollbarThumb);
  root.style.setProperty('--scrollbar-track', dto.scrollbarTrack);
  // nếu muốn gradient nút: lưu buttonFrom/To ở redux & dùng class inline style
}
