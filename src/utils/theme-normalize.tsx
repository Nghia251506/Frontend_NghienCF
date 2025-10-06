import { ThemeDto } from "../types/theme";
import { defaultTheme } from "../types/theme";

export function toThemeDto(api: any | null | undefined): ThemeDto {
  if (!api) return defaultTheme;

  const pick = (obj: any, ...keys: string[]) =>
    keys.map(k => obj?.[k]).find(v => typeof v === "string" && v.trim().length) as string | undefined;

  return {
    primaryColor:  pick(api, "primaryColor", "primary", "PrimaryColor", "Primary") || defaultTheme.primaryColor,
    accent:        pick(api, "accent", "Accent") || defaultTheme.accent,
    background:    pick(api, "background", "Background") || defaultTheme.background,
    surface:       pick(api, "surface", "Surface") || defaultTheme.surface,
    text:          pick(api, "text", "Text") || defaultTheme.text,
    muted:         pick(api, "muted", "Muted") || defaultTheme.muted,
    navbar:        pick(api, "navbar", "Navbar") || defaultTheme.navbar,
    buttonFrom:    pick(api, "buttonFrom", "ButtonFrom") || defaultTheme.buttonFrom,
    buttonTo:      pick(api, "buttonTo", "ButtonTo") || defaultTheme.buttonTo,
    scrollbarThumb:pick(api, "scrollbarThumb", "ScrollbarThumb") || defaultTheme.scrollbarThumb,
    scrollbarTrack:pick(api, "scrollbarTrack", "ScrollbarTrack") || defaultTheme.scrollbarTrack,
  };
}