export interface Ticket {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: "valid" | "used" | "canceled" | string;       // "valid" | "used" | ...
  issuedAt: string;      // ISO string từ backend
}

export interface TicketCreateDto {
  bookingId: number;
  /** ISO date "yyyy-MM-dd" hoặc null để SP dùng CURDATE() */
  eventDate?: string | null;
}

export type TicketUpdateDto = {
  status?: "valid" | "used" | "canceled" | string;
  // Nếu backend cho phép đổi bookingId thì thêm:
  // bookingId?: number;
};

export type TicketQuery = {
  showId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
};
