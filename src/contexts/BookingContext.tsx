import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BookingData } from '../types';

interface BookingContextType {
  bookingData: BookingData | null;
  setBookingData: (data: BookingData) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const clearBooking = () => {
    setBookingData(null);
  };

  return (
    <BookingContext.Provider value={{ bookingData, setBookingData, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
};