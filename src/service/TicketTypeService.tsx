import axiosClient from "../axios/axiosClient";
import { TicketType, TicketTypeCreateDto } from "../types/TicketType";

const TICKETTYPE_URL = "/tickettype";

export const getAllTypes = async (): Promise<TicketType[]> => {
  return await axiosClient.get(`${TICKETTYPE_URL}/getall`);
};

export const createType = async (dto: TicketTypeCreateDto): Promise<TicketType> => {
  return await axiosClient.post(TICKETTYPE_URL, dto);
};

export const updateType = async (id: number, type: TicketType): Promise<void> => {
  await axiosClient.put(`${TICKETTYPE_URL}/${id}`, type);
};

export const deleteType = async (id: number): Promise<void> => {
  await axiosClient.delete(`${TICKETTYPE_URL}/${id}`);
};