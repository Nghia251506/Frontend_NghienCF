// redux/BookingSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Booking, CreateBookingDto, BookingResponseDto } from "../types/Booking";
import {
  getAllBooking as apiGetAllBookings,
  createBooking as apiCreateBooking,
} from "../service/BookingService";

interface BookingState {
  items: Booking[];
  loading: boolean;      // tải danh sách
  creating: boolean;     // tạo booking
  error: string | null;
  lastCreate: BookingResponseDto | null; // giữ response từ backend để trang /payment dùng
}

const initialState: BookingState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
  lastCreate: null,
};

// GET /booking/getall
export const fetchBookings = createAsyncThunk<Booking[]>(
  "bookings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetAllBookings(); // nếu axiosClient trả AxiosResponse => return res.data
      return res;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Fetch bookings failed"
      );
    }
  }
);

// POST /booking/create
export const createBooking = createAsyncThunk<
  BookingResponseDto,
  CreateBookingDto
>("bookings/create", async (dto, { rejectWithValue }) => {
  try {
    const res = await apiCreateBooking(dto); // nếu AxiosResponse => return res.data
    return res;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Create booking failed"
    );
  }
});

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    resetBookingError(state) {
      state.error = null;
    },
    clearBookings(state) {
      state.items = [];
      state.lastCreate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
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
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false;
        state.lastCreate = action.payload; // { bookingId, totalAmount, paymentQrUrl }

        // Map từ meta.arg (dto gửi lên) + payload -> Booking để thêm vào bảng
        const dto = action.meta.arg;
        const created: Booking = {
          id: action.payload.bookingId,
          showId: dto.showId,
          ticketTypeId: dto.ticketTypeId,
          customerName: dto.customerName,
          phone: dto.phone,
          quantity: dto.quantity,
          totalAmount: action.payload.totalAmount,
          paymentStatus: "pending",
          paymentTime: null, // chờ webhook / job cập nhật
          createdAt: null
        };
        state.items.unshift(created);
      })
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
