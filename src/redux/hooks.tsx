import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// Dùng cho dispatch với kiểu AppDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// Dùng cho useSelector với kiểu RootState
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;