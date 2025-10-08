// src/service/BookingService.ts
import axiosClient from "../axios/axiosClient";
import type { Booking, BookingResponseDto, CreateBookingDto } from "../types/Booking";

const BOOKING_URL = "/booking";

// GET /booking/getall
export const getAllBooking = async (): Promise<Booking[]> => {
  const  data  = await axiosClient.get<Booking[]>(`${BOOKING_URL}/getall`);
  return data;
};

// POST /booking/create  (body phẳng, KHÔNG bọc { dto })
export const createBooking = async (dto: CreateBookingDto): Promise<BookingResponseDto> => {
  const  data  = await axiosClient.post<BookingResponseDto>(`${BOOKING_URL}/create`, dto);
  return data;
};
