import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Ticket, TicketCreateDto } from "../types/Ticket";
import { createTicket, getTicketsByBooking } from "../service/TicketService";

interface TicketState {
  itemsByBooking: Record<number, Ticket[]>;
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: TicketState = {
  itemsByBooking: {},
  loading: false,
  creating: false,
  error: null,
};

// Lấy danh sách vé theo booking
export const fetchTicketsByBooking = createAsyncThunk<Ticket[], number>(
  "tickets/fetchByBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await getTicketsByBooking(bookingId);
      return res;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Fetch tickets failed"
      );
    }
  }
);

// Sinh N vé cho một booking (loop client-side; nếu có endpoint issue-many thì dùng endpoint đó thay thế)
export const issueTicketsForBooking = createAsyncThunk<
  Ticket[], // trả về list vé đã tạo
  { bookingId: number; quantity: number; eventDate?: string | null }
>(
  "tickets/issueMany",
  async ({ bookingId, quantity, eventDate = null }, { rejectWithValue }) => {
    try {
      const created: Ticket[] = [];
      for (let i = 0; i < quantity; i++) {
        const dto: TicketCreateDto = { bookingId, eventDate };
        const t = await createTicket(dto);
        created.push(t);
      }
      return created;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Issue tickets failed"
      );
    }
  }
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearTicketsByBooking(state, action: PayloadAction<number>) {
      delete state.itemsByBooking[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTicketsByBooking
      .addCase(fetchTicketsByBooking.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTicketsByBooking.fulfilled, (s, a) => {
        s.loading = false;
        // biết bookingId từ payload? -> lấy từ items nếu có, hoặc suy luận từ first item.
        const list = a.payload ?? [];
        if (list.length > 0) {
          const bookingId = list[0].bookingId;
          s.itemsByBooking[bookingId] = list;
        }
      })
      .addCase(fetchTicketsByBooking.rejected, (s, a) => {
        s.loading = false;
        s.error = (a.payload as string) ?? a.error.message ?? "Fetch tickets failed";
      })

      // issueTicketsForBooking
      .addCase(issueTicketsForBooking.pending, (s) => {
        s.creating = true;
        s.error = null;
      })
      .addCase(issueTicketsForBooking.fulfilled, (s, a) => {
        s.creating = false;
        const created = a.payload ?? [];
        if (created.length > 0) {
          const bookingId = created[0].bookingId;
          const existed = s.itemsByBooking[bookingId] ?? [];
          s.itemsByBooking[bookingId] = [...created, ...existed];
        }
      })
      .addCase(issueTicketsForBooking.rejected, (s, a) => {
        s.creating = false;
        s.error = (a.payload as string) ?? a.error.message ?? "Issue tickets failed";
      });
  },
});

export const { clearTicketsByBooking } = ticketSlice.actions;
export default ticketSlice.reducer;
