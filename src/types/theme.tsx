// src/types/theme.ts

/** Bản ghi theme lấy từ API */
export interface ThemeSetting {
  id: number;
  showId: number | null;        // null = global
  primary: string;              // "#RRGGBB"
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  navbar: string;
  buttonFrom: string;
  buttonTo: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  updatedAt: string;            // ISO
}

/** Payload tạo mới */
export interface ThemeCreateDto {
  showId: number | null;        // null nếu là global
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  navbar: string;
  buttonFrom: string;
  buttonTo: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
}

/** Payload cập nhật */
export type ThemeUpdateDto = ThemeCreateDto;

/** Theme đang áp dụng cho FE (dễ dùng để apply vào CSS vars) */
export interface ThemeDto {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  navbar: string;
  buttonFrom: string;
  buttonTo: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
}

/** Paged helper (nếu API có phân trang) */
export type Paged<T> = {
  items: T[];
  total: number;
};

/** State cho Redux slice */
export interface ThemeState {
  current: ThemeDto | null;     // theme đang dùng (GET /active)
  list: ThemeSetting[];         // toàn bộ (GET /api/theme-settings)
  loading: boolean;
  saving: boolean;
  error?: string | null;
}

/** Mặc định an toàn (khớp màu hiện tại) */
export const defaultTheme: ThemeDto = {
  primary: "#f59e0b",
  accent: "#f97316",
  background: "#0a0a0a",
  surface: "#111827",
  text: "#ffffff",
  muted: "#9ca3af",
  navbar: "#000000",
  buttonFrom: "#f59e0b",
  buttonTo: "#f97316",
  scrollbarThumb: "#f59e0b",
  scrollbarTrack: "#1f2937",
};

/** Regex kiểm tra mã màu #RGB/#RRGGBB */
export const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Guard nho nhỏ để validate nhanh trên FE */
export function isValidHexColor(s: string | null | undefined): s is string {
  return !!s && HEX_RE.test(s);
}

/** Map ThemeSetting -> ThemeDto (tiện applyTheme) */
export function toThemeDto(x: ThemeSetting): ThemeDto {
  const {
    primary, accent, background, surface, text, muted,
    navbar, buttonFrom, buttonTo, scrollbarThumb, scrollbarTrack,
  } = x;
  return {
    primary, accent, background, surface, text, muted,
    navbar, buttonFrom, buttonTo, scrollbarThumb, scrollbarTrack,
  };
}