import axiosClient from "../axios/axiosClient";
import { Ticket, TicketCreateDto } from "../types/Ticket";

const TICKET_URL = "/ticket";

export const getTicketsByBooking = async (bookingId: number): Promise<Ticket[]> => {
  // GET /api/ticket/by-booking/{bookingId}
  const res = await axiosClient.get(`${TICKET_URL}/by-booking/${bookingId}`);
  // nếu axiosClient chưa unwrap -> return res.data;
  return res;
};

export const createTicket = async (dto: TicketCreateDto): Promise<Ticket> => {
  // POST /api/ticket/create
  const res = await axiosClient.post(`${TICKET_URL}/create`, dto);
  return res;
};

export const devForcePay = async (bookingId: number): Promise<void> => {
  await axiosClient.post(`dev-pay/${bookingId}`);
};
