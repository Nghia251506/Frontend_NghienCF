import axiosClient from "../axios/axiosClient";
import { Booking, BookingDto, BookingResponseDto, CreateBookingDto } from "../types/Booking";



const BOOKING_URL = "/booking";

export const getAllBooking = async (): Promise<Booking[]> => {
  return await axiosClient.get(`${BOOKING_URL}/getall`, { withCredentials: true });
};

export const createBooking = async (dto: CreateBookingDto): Promise<BookingResponseDto> => {
  return await axiosClient.post(`${BOOKING_URL}/create`, dto);
};
