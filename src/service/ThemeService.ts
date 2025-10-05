// src/service/themeService.ts
import axiosClient from "../axios/axiosClient";
import type {
  ThemeDto,
  ThemeSetting,
  ThemeCreateDto,
  ThemeUpdateDto,
  Paged,
} from "../types/theme";

const BASE = "/api/theme-settings";

/** Lấy theme đang áp dụng. Nếu không truyền showId => fallback global */
export const getActiveTheme = (showId?: number | null) =>
  axiosClient.get<ThemeDto | null>(
    showId != null ? `${BASE}/active?showId=${showId}` : `${BASE}/active`
  );

/** Lấy toàn bộ theme (quản trị) */
export const listThemes = () =>
  axiosClient.get<ThemeSetting[] | Paged<ThemeSetting>>(BASE);

/** Lấy 1 theme theo id */
export const getThemeById = (id: number) =>
  axiosClient.get<ThemeSetting>(`${BASE}/${id}`);

/** Tạo theme mới (global hoặc theo show) */
export const createTheme = (dto: ThemeCreateDto) =>
  axiosClient.post<ThemeSetting>(BASE, dto);

/** Cập nhật theme */
export const updateTheme = (id: number, dto: ThemeUpdateDto) =>
  axiosClient.put<ThemeSetting>(`${BASE}/${id}`, dto);

/** Xoá theme */
export const deleteTheme = (id: number) =>
  axiosClient.delete<void>(`${BASE}/${id}`);
