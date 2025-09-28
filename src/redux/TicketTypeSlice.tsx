// redux/TicketTypeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TicketType, TicketTypeCreateDto } from "../types/TicketType";
import {
  getAllTypes as apiGetAllTypes,
  createType as apiCreateType,
  updateType as apiUpdateType,   // <- update by id
  deleteType as apiDeleteType,
} from "../service/TicketTypeService";

interface TicketTypeState {
  items: TicketType[];
  selected?: TicketType | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  removingId: number | null;
  error: string | null;
}

const initialState: TicketTypeState = {
  items: [],
  selected: null,
  loading: false,
  creating: false,
  updating: false,
  removingId: null,
  error: null,
};

export const fetchTicketTypes = createAsyncThunk<
  TicketType[],
  void,
  { rejectValue: string }
>("ticketTypes/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetAllTypes();
    return res; // nếu axiosClient chưa unwrap: return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Fetch ticket types failed"
    );
  }
});

export const addTicketType = createAsyncThunk<
  TicketType,
  TicketTypeCreateDto,
  { rejectValue: string }
>("ticketTypes/add", async (dto, { rejectWithValue }) => {
  try {
    const res = await apiCreateType(dto);
    return res;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Create ticket type failed"
    );
  }
});

// ✅ SỬA: update theo id
export const editTicketType = createAsyncThunk<
  { id: number; type: TicketType },
  { id: number; type: TicketType },
  { rejectValue: string }
>("ticketTypes/edit", async ({ id, type }, { rejectWithValue }) => {
  try {
    await apiUpdateType(id, type);
    return { id, type };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Update ticket type failed"
    );
  }
});

export const removeTicketType = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("ticketTypes/remove", async (id, { rejectWithValue }) => {
  try {
    await apiDeleteType(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Delete ticket type failed"
    );
  }
});

const ticketTypeSlice = createSlice({
  name: "ticketTypes",
  initialState,
  reducers: {
    resetTicketTypeError(state) {
      state.error = null;
    },
    setSelectedTicketType(state, action: PayloadAction<TicketType | null>) {
      state.selected = action.payload;
    },
    clearTicketTypes(state) {
      state.items = [];
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTicketTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketTypes.fulfilled, (state, action: PayloadAction<TicketType[]>) => {
        state.loading = false;
        state.items = action.payload ?? [];
      })
      .addCase(fetchTicketTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Fetch ticket types failed";
      })

      // add
      .addCase(addTicketType.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(addTicketType.fulfilled, (state, action: PayloadAction<TicketType>) => {
        state.creating = false;
        if (action.payload) state.items.unshift(action.payload);
      })
      .addCase(addTicketType.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? action.error.message ?? "Create ticket type failed";
      })

      // ✅ edit by id
      .addCase(editTicketType.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(editTicketType.fulfilled, (state, action) => {
        state.updating = false;
        const { id, type } = action.payload;
        const idx = state.items.findIndex((t) => t.id === id);
        if (idx !== -1) state.items[idx] = type;
      })
      .addCase(editTicketType.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? action.error.message ?? "Update ticket type failed";
      })

      // remove
      .addCase(removeTicketType.pending, (state, action) => {
        state.removingId = action.meta.arg;
        state.error = null;
      })
      .addCase(removeTicketType.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.removingId = null;
      })
      .addCase(removeTicketType.rejected, (state, action) => {
        state.removingId = null;
        state.error = action.payload ?? action.error.message ?? "Delete ticket type failed";
      });
  },
});

export const { resetTicketTypeError, setSelectedTicketType, clearTicketTypes } =
  ticketTypeSlice.actions;

export default ticketTypeSlice.reducer;
