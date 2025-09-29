import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Ticket, TicketCreateDto, TicketUpdateDto, TicketQuery } from "../types/Ticket";
import {
  getAllTickets,
  getTicketsByBooking,
  createTicket,
  updateTicket,
} from "../service/TicketService";

type TicketState = {
  items: Ticket[];
  loading: boolean;
  updating: boolean;
  error: string | null;
};

const initialState: TicketState = {
  items: [],
  loading: false,
  updating: false,
  error: null,
};

// ==== Thunks ====

// GET all (có thể kèm filter)
export const fetchTickets = createAsyncThunk<Ticket[], TicketQuery | undefined>(
  "tickets/fetchAll",
  async (query, { rejectWithValue }) => {
    try {
      return await getAllTickets(query);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || "Fetch tickets failed");
    }
  }
);

// GET by booking
export const fetchTicketsByBooking = createAsyncThunk<Ticket[], number>(
  "tickets/fetchByBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      return await getTicketsByBooking(bookingId);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || "Fetch tickets by booking failed");
    }
  }
);

// (tuỳ nhu cầu) POST create
export const createTicketThunk = createAsyncThunk<Ticket, TicketCreateDto>(
  "tickets/create",
  async (dto, { rejectWithValue }) => {
    try {
      return await createTicket(dto);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || "Create ticket failed");
    }
  }
);

// PUT update
export const updateTicketThunk = createAsyncThunk<Ticket, { id: number; dto: TicketUpdateDto }>(
  "tickets/update",
  async ({ id, dto }, { rejectWithValue }) => {
    try {
      return await updateTicket(id, dto);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || "Update ticket failed");
    }
  }
);

// ==== Slice ====
const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearTicketError(state) {
      state.error = null;
    },
    resetTickets(state) {
      state.items = [];
      state.loading = false;
      state.updating = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder.addCase(fetchTickets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTickets.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchTickets.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? "Fetch tickets failed";
    });

    // fetchByBooking
    builder.addCase(fetchTicketsByBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTicketsByBooking.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchTicketsByBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? "Fetch tickets by booking failed";
    });

    // create
    builder.addCase(createTicketThunk.pending, (state) => {
      state.updating = true;
      state.error = null;
    });
    builder.addCase(createTicketThunk.fulfilled, (state, action: PayloadAction<Ticket>) => {
      state.updating = false;
      state.items.unshift(action.payload);
    });
    builder.addCase(createTicketThunk.rejected, (state, action) => {
      state.updating = false;
      state.error = (action.payload as string) ?? "Create ticket failed";
    });

    // update
    builder.addCase(updateTicketThunk.pending, (state) => {
      state.updating = true;
      state.error = null;
    });
    builder.addCase(updateTicketThunk.fulfilled, (state, action: PayloadAction<Ticket>) => {
      state.updating = false;
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
    });
    builder.addCase(updateTicketThunk.rejected, (state, action) => {
      state.updating = false;
      state.error = (action.payload as string) ?? "Update ticket failed";
    });
  },
});

export const { clearTicketError, resetTickets } = ticketSlice.actions;
export default ticketSlice.reducer;
