import axiosClient from "../axios/axiosClient";
import { Booking, BookingDto } from "../types/Booking";

const BOOKING_URL = "/booking";

export const getAllShows = async (): Promise<Booking[]> => {
  return await axiosClient.get(`${BOOKING_URL}/getall`);
};

export const createShow = async (dto: BookingDto): Promise<Booking> => {
  return await axiosClient.post(`${BOOKING_URL}/create`, dto);
};