// redux/ShowSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Show, ShowCreateDto } from "../types/Show";
import {
  getAllShows,
  getShowByType,
  createShow,
  updateShow,
  deleteShow,
} from "../service/ShowService";

interface ShowState {
  items: Show[];
  selected?: Show | null;
  loading: boolean;
  error: string | null;
  defaultId: number | null; // 👈 thêm
}

const initialState: ShowState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
  defaultId: null,
};

// thunks
export const fetchShows = createAsyncThunk("shows/fetchAll", async () => {
  return await getAllShows();
});

export const fetchShowById = createAsyncThunk(
  "shows/fetchByTitle",
  async (title: string) => {
    return await getShowByType(title);
  }
);

export const addShow = createAsyncThunk("shows/add", async (dto: ShowCreateDto) => {
  return await createShow(dto);
});

export const editShow = createAsyncThunk(
  "shows/edit",
  // ⚠️ giữ nguyên theo service của bạn: server update theo title
  async ({ title, show }: { title: string; show: Show }) => {
    await updateShow(title, show);
    return { title, show };
  }
);

export const removeShow = createAsyncThunk("shows/remove", async (id: number) => {
  await deleteShow(id);
  return id;
});

const ShowSlice = createSlice({
  name: "shows",
  initialState,
  reducers: {
    setDefaultShow(state, action: PayloadAction<number>) {
      state.defaultId = action.payload;
      // optional: persist
      try { localStorage.setItem("defaultShowId", String(action.payload)); } catch {}
    },
    hydrateDefaultShow(state) {
      try {
        const s = localStorage.getItem("defaultShowId");
        state.defaultId = s ? Number(s) : null;
      } catch {}
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchShows.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShows.fulfilled, (state, action: PayloadAction<Show[]>) => {
        state.loading = false;
        state.items = action.payload;
        // nếu chưa có defaultId mà có dữ liệu thì set tạm id đầu tiên
        if (state.defaultId == null && action.payload.length > 0) {
          state.defaultId = action.payload[0].id!;
        }
      })
      .addCase(fetchShows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Fetch shows failed";
      })

      // fetchById
      .addCase(fetchShowById.fulfilled, (state, action: PayloadAction<Show>) => {
        state.selected = action.payload;
      })

      // add
      .addCase(addShow.fulfilled, (state, action: PayloadAction<Show>) => {
        state.items.unshift(action.payload);
        if (state.defaultId == null && action.payload.id) {
          state.defaultId = action.payload.id;
        }
      })

      // edit
      .addCase(editShow.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.title === action.payload.title);
        if (idx !== -1) state.items[idx] = action.payload.show;
      })

      // remove
      .addCase(removeShow.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
        if (state.defaultId === action.payload) {
          state.defaultId = state.items.length ? state.items[0].id ?? null : null;
        }
      });
  },
});

export const { setDefaultShow, hydrateDefaultShow } = ShowSlice.actions;
export default ShowSlice.reducer;
