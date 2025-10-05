import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getTheme, updateTheme } from "../service/ThemeService";
import type { ThemeDto } from "../utils/applyTheme";

export const fetchTheme = createAsyncThunk("theme/fetch", async () => await getTheme());
export const saveTheme = createAsyncThunk("theme/save", async (dto: ThemeDto) => await updateTheme(dto));

const slice = createSlice({
  name: "theme",
  initialState: { current: null as ThemeDto | null, loading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchTheme.pending, s => { s.loading = true; });
    b.addCase(fetchTheme.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; });
    b.addCase(fetchTheme.rejected, s => { s.loading = false; });
    b.addCase(saveTheme.fulfilled, (s, a) => { /* giữ nguyên */ });
  }
});
export default slice.reducer;
