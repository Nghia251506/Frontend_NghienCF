import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { getGaDaily, GaDaily } from "../service/GaService";

export type GaRange = { start: string; end: string };

type GaState = {
  items: GaDaily[];
  loading: boolean;
  error: string | null;
  range: GaRange;
};

const initialState: GaState = {
  items: [],
  loading: false,
  error: null,
  range: { start: "7daysAgo", end: "today" },
};

export const fetchGaDaily = createAsyncThunk<
  GaDaily[],
  GaRange,
  { rejectValue: string }
>("ga/fetchDaily", async (range, { rejectWithValue }) => {
  try {
    return await getGaDaily(range);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Fetch GA4 failed"
    );
  }
});

const gaSlice = createSlice({
  name: "ga",
  initialState,
  reducers: {
    setGaRange(state, action: PayloadAction<GaRange>) {
      state.range = action.payload;
    },
    clearGa(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchGaDaily.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchGaDaily.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload ?? [];
    });
    b.addCase(fetchGaDaily.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error.message ?? "Fetch GA4 failed";
    });
  },
});

export const { setGaRange, clearGa } = gaSlice.actions;

// selectors
export const selectGa = (s: RootState) => s.ga;
export const selectGaTotals = (s: RootState) => {
  const { items } = s.ga;
  const activeUsers = items.reduce((sum: any, i: { activeUsers: any; }) => sum + (i.activeUsers ?? 0), 0);
  const pageViews   = items.reduce((sum: any, i: { pageViews: any; }) => sum + (i.pageViews ?? 0), 0);
  return { activeUsers, pageViews };
};

export default gaSlice.reducer;
