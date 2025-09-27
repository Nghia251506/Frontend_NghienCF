import { configureStore } from "@reduxjs/toolkit";
import showReducer from "./ShowSlice";
import authReducer from "./UserSlice";


export const store = configureStore({
  reducer: {
    shows: showReducer,
    auth: authReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;