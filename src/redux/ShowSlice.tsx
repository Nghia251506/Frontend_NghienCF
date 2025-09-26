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
}

const initialState: ShowState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// thunks
export const fetchShows = createAsyncThunk("shows/fetchAll", async () => {
  return await getAllShows();
});

export const fetchShowById = createAsyncThunk("shows/fetchByTitle", async (title: string) => {
  return await getShowByType(title);
});

export const addShow = createAsyncThunk("shows/add", async (dto: ShowCreateDto) => {
  return await createShow(dto);
});

export const editShow = createAsyncThunk(
  "shows/edit",
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchShows.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShows.fulfilled, (state, action: PayloadAction<Show[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchShows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Fetch employees failed";
      })

      // fetchById
      .addCase(fetchShowById.fulfilled, (state, action: PayloadAction<Show>) => {
        state.selected = action.payload;
      })

      // add
      .addCase(addShow.fulfilled, (state, action: PayloadAction<Show>) => {
        state.items.push(action.payload);
      })

      // edit
      .addCase(editShow.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.title === action.payload.title);
        if (idx !== -1) state.items[idx] = action.payload.show;
      })

      // remove
      .addCase(removeShow.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      });
  },
});

export default ShowSlice.reducer;