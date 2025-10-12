// src/service/BookingService.ts
import axiosClient from "../axios/axiosClient";
import type { Booking, BookingResponseDto, CreateBookingDto } from "../types/Booking";

const BOOKING_URL = "/booking";

// GET /booking/getall
export const getAllBooking = async (): Promise<Booking[]> => {
  return await axiosClient.get<Booking[]>(`${BOOKING_URL}/getall`);
};

// POST /booking/create  (body phẳng, KHÔNG bọc { dto })
export const createBooking = async (dto: CreateBookingDto): Promise<BookingResponseDto> => {
  return await axiosClient.post<BookingResponseDto>(`${BOOKING_URL}/create`, dto);
};
