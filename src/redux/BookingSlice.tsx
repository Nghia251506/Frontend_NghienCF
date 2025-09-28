// redux/BookingSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Booking, BookingDto } from "../types/Booking";
import {
  getAllShows as apiGetAllBookings,   // alias cho đúng ngữ nghĩa
  createShow as apiCreateBooking,
} from "../service/BookingService";

interface BookingState {
  items: Booking[];
  loading: boolean;     // tải danh sách
  creating: boolean;    // tạo booking
  error: string | null;
}

const initialState: BookingState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

// GET /booking/getall
export const fetchBookings = createAsyncThunk<Booking[]>(
  "bookings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetAllBookings();
      return res; // nếu axiosClient chưa unwrap: return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Fetch bookings failed"
      );
    }
  }
);

// POST /booking/create
export const createBooking = createAsyncThunk<Booking, BookingDto>(
  "bookings/create",
  async (dto, { rejectWithValue }) => {
    try {
      const res = await apiCreateBooking(dto);
      return res; // nếu axiosClient chưa unwrap: return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Create booking failed"
      );
    }
  }
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    resetBookingError(state) {
      state.error = null;
    },
    clearBookings(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBookings.fulfilled,
        (state, action: PayloadAction<Booking[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "Fetch bookings failed";
      })

      // createBooking
      .addCase(createBooking.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(
        createBooking.fulfilled,
        (state, action: PayloadAction<Booking>) => {
          state.creating = false;
          // thêm lên đầu danh sách cho dễ thấy
          state.items.unshift(action.payload);
        }
      )
      .addCase(createBooking.rejected, (state, action) => {
        state.creating = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "Create booking failed";
      });
  },
});

export const { resetBookingError, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
