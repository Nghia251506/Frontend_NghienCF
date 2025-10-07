// src/service/themeService.ts
import axiosClient from "../axios/axiosClient";
import type {
  ThemeDto,
  ThemeSetting,
  ThemeCreateDto,
  ThemeUpdateDto,
  Paged,
} from "../types/theme";

const THEME_URL = "/theme-settings";

/** Lấy theme đang áp dụng. Nếu không truyền showId => fallback global (ShowId = null) */
export const getActiveTheme = async (showId?: number | null): Promise<ThemeDto | null> => {
  const qs = showId != null ? `?showId=${showId}` : "";
  return await axiosClient.get(`${THEME_URL}/active${qs}`, { withCredentials: true });
};

/** Lấy toàn bộ theme (cho admin) */
export const getAllThemes = async (): Promise<ThemeSetting[] | Paged<ThemeSetting>> => {
  return await axiosClient.get(`${THEME_URL}`, { withCredentials: true });
};

/** Lấy một theme theo id */
export const getThemeById = async (id: number): Promise<ThemeSetting> => {
  return await axiosClient.get(`${THEME_URL}/${id}`, { withCredentials: true });
};

/** Tạo theme mới (global hoặc theo show) */
export const createTheme = async (dto: ThemeCreateDto): Promise<ThemeSetting> => {
  return await axiosClient.post(THEME_URL, dto, { withCredentials: true });
};

/** Cập nhật theme theo id */
export const updateTheme = async (id: number, dto: ThemeUpdateDto): Promise<ThemeSetting> => {
  return await axiosClient.put(`${THEME_URL}/${id}`, dto, { withCredentials: true });
};

/** Xoá theme theo id */
export const deleteTheme = async (id: number): Promise<void> => {
  await axiosClient.delete(`${THEME_URL}/${id}`, { withCredentials: true });
};
