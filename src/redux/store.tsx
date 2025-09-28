import { configureStore } from "@reduxjs/toolkit";
import showReducer from "./ShowSlice";
import authReducer from "./UserSlice";
import bookingReducer from "./BookingSlice"
import tickettypeReducer from "./TicketTypeSlice"
import ticketsReducer from "./TicketSlice";


export const store = configureStore({
  reducer: {
    shows: showReducer,
    auth: authReducer,
    bookings: bookingReducer ,
    ticketTypes: tickettypeReducer,
    tickets: ticketsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;