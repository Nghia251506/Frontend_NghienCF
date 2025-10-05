// src/redux/ThemeSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ThemeDto, ThemeSetting, ThemeCreateDto, ThemeUpdateDto } from "../types/theme";
import {
  getActiveTheme,
  listThemes,
  createTheme,
  updateTheme as apiUpdateTheme,
  deleteTheme as apiDeleteTheme,
} from "../service/ThemeService";

export interface ThemeState {
  current: ThemeDto | null;         // theme đang áp dụng cho FE
  list: ThemeSetting[];             // danh sách (cho trang admin)
  loading: boolean;                 // loading cho fetch active
  saving: boolean;                  // saving cho create/update
  error?: string | null;
}

const initialState: ThemeState = {
  current: null,
  list: [],
  loading: false,
  saving: false,
  error: null,
};

/** Lấy theme đang áp dụng (nếu không truyền showId -> lấy global) */
export const fetchTheme = createAsyncThunk(
  "theme/fetchActive",
  async (showId?: number | null) => await getActiveTheme(showId)
);

/** ADMIN: lấy toàn bộ themes */
export const fetchThemeList = createAsyncThunk(
  "theme/fetchList",
  async () => await listThemes()
);

/** ADMIN: tạo theme mới */
export const createThemeThunk = createAsyncThunk(
  "theme/create",
  async (dto: ThemeCreateDto) => await createTheme(dto)
);

/** ADMIN: cập nhật theme theo id */
export const updateThemeThunk = createAsyncThunk(
  "theme/update",
  async (payload: { id: number; dto: ThemeUpdateDto }) =>
    await apiUpdateTheme(payload.id, payload.dto)
);

/** ADMIN: xoá theme */
export const deleteThemeThunk = createAsyncThunk(
  "theme/delete",
  async (id: number) => {
    await apiDeleteTheme(id);
    return id;
  }
);

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    // fetch active
    b.addCase(fetchTheme.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchTheme.fulfilled, (s, a) => { s.loading = false; s.current = a.payload ?? null; });
    b.addCase(fetchTheme.rejected, (s, a) => { s.loading = false; s.error = String(a.error.message || "Fetch theme failed"); });

    // list
    b.addCase(fetchThemeList.fulfilled, (s, a) => {
      // API có thể trả mảng hoặc {items,total}; ta chuẩn hoá về mảng
      const data = Array.isArray(a.payload) ? a.payload : a.payload.items;
      s.list = data ?? [];
    });

    // create
    b.addCase(createThemeThunk.pending, (s) => { s.saving = true; s.error = null; });
    b.addCase(createThemeThunk.fulfilled, (s, a) => {
      s.saving = false;
      s.list.unshift(a.payload);
    });
    b.addCase(createThemeThunk.rejected, (s, a) => { s.saving = false; s.error = String(a.error.message || "Create theme failed"); });

    // update
    b.addCase(updateThemeThunk.pending, (s) => { s.saving = true; s.error = null; });
    b.addCase(updateThemeThunk.fulfilled, (s, a) => {
      s.saving = false;
      const i = s.list.findIndex(x => x.id === a.payload.id);
      if (i >= 0) s.list[i] = a.payload;
      // nếu đây là theme đang active (FE), có thể tự refresh lại:
      // s.current = toThemeDto(a.payload) // nếu muốn cập nhật ngay
    });
    b.addCase(updateThemeThunk.rejected, (s, a) => { s.saving = false; s.error = String(a.error.message || "Update theme failed"); });

    // delete
    b.addCase(deleteThemeThunk.fulfilled, (s, a) => {
      s.list = s.list.filter(x => x.id !== a.payload);
    });
  },
});

export default themeSlice.reducer;