export interface Ticket {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: string;        // "valid" | "used" | ...
  issuedAt: string;      // ISO string từ backend
}

export interface TicketCreateDto {
  bookingId: number;
  /** ISO date "yyyy-MM-dd" hoặc null để SP dùng CURDATE() */
  eventDate?: string | null;
}
