import axiosClient from "../axios/axiosClient";
import { Ticket, TicketCreateDto, TicketUpdateDto, TicketQuery } from "../types/Ticket";

const TICKET_URL = "/ticket";

// GET /api/ticket?showId=&status=&page=&pageSize=
export const getAllTickets = async (query?: TicketQuery): Promise<Ticket[]> => {
  return await axiosClient.get(`${TICKET_URL}/getall`, { params: query });
};

// GET /api/ticket/by-booking/{bookingId}
export const getTicketsByBooking = async (bookingId: number): Promise<Ticket[]> => {
  return await axiosClient.get(`${TICKET_URL}/by-booking/${bookingId}`);
};

// (tuỳ nhu cầu) GET /api/ticket/{id}
export const getTicketById = async (id: number): Promise<Ticket> => {
  return await axiosClient.get(`${TICKET_URL}/${id}`);
};

// POST /api/ticket/create
export const createTicket = async (dto: TicketCreateDto): Promise<Ticket> => {
  return await axiosClient.post(`${TICKET_URL}/create`, dto);
};

// PUT /api/ticket/{id}
export const updateTicket = async (id: number, dto: TicketUpdateDto): Promise<Ticket> => {
  return await axiosClient.put(`${TICKET_URL}/${id}/status`, dto);
};

// DEV: POST /api/dev-pay/{bookingId}
export const devForcePay = async (bookingId: number): Promise<void> => {
  await axiosClient.post(`dev-pay/${bookingId}`);
};
