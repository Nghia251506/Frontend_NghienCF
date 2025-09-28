import React, { createContext, useContext, useState } from "react";
import { BookingData } from "../types/Booking"; // ⬅️ import mới

type BookingCtx = {
  bookingData: BookingData | null;
  setBookingData: (d: BookingData) => void;
  clear: () => void;
};

const Ctx = createContext<BookingCtx>({
  bookingData: null,
  setBookingData: () => {},
  clear: () => {},
});

export const BookingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const clear = () => setBookingData(null);

  return (
    <Ctx.Provider value={{ bookingData, setBookingData, clear }}>
      {children}
    </Ctx.Provider>
  );
};

export const useBooking = () => useContext(Ctx);
