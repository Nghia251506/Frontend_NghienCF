export interface Booking{
    id: number;
    showId: number;
    ticketTypeId: number;
    customerName: string;
    phone: string;
    quantity: number;
    totalAmount: number;
    paymentStatus: string;
    paymentTime: string | null;
    createdAt: string | null;
}

export interface BookingDto{
    showId?: number;
    customerName: string;
    phone: string;
    ticketTypeId: number;
    quantity: number;
}
export type CreateBookingDto = {
  showId: number;
  ticketTypeId: number;
  customerName: string;
  phone: string;
  quantity: number;
};

export type BookingResponseDto = {
    showId: number;
  ticketTypeId: number;
  customerName: string;
  phone: string;
  quantity: number;
  bookingId: number;
  totalAmount: number;
  paymentQrUrl: string;
};

export interface BookingData {
  customerName: string;
  phone: string;
  combo: string;          // tên ticket type đã chọn
  quantity: number;
  totalPrice: number;
  seatNumbers?: string[];

  // thêm để dùng cho trang /payment
  bookingId?: number;
  paymentQrUrl?: string;
  paymentStatus?: "pending" | "paid" | "failed";
}