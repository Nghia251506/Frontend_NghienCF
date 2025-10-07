// src/redux/UserSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User, LoginDto, AuthResponse } from "../types/User";
import { login as loginApi, me as meApi, logout as logoutApi } from "../service/UserService";

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  hasHydrated: boolean;       // 👈 cờ đã hydrate xong (dù thành công hay thất bại)
}

const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null,
  hasHydrated: false,         // 👈 ban đầu là false
};

export const hydrateAuth = createAsyncThunk<User | null>(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const user = await meApi();  // withCredentials
      return user;                 // có user => đã đăng nhập
    } catch {
      return rejectWithValue(null); // 401 => chưa đăng nhập
    }
  }
);

export const Login = createAsyncThunk<User, LoginDto>(
  "auth/login",
  async (dto, { rejectWithValue }) => {
    try {
      const res: AuthResponse = await loginApi(dto);
      const user = (res as any)?.user ?? res;
      return user as User;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Login failed");
    }
  }
);

export const Logout = createAsyncThunk<void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try { await logoutApi(); }
    catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Logout failed");
    }
  }
);

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.currentUser = null;
      state.error = null;
      state.loading = false;
      state.hasHydrated = true; // coi như đã biết trạng thái
    },
    resetError(state) { state.error = null; },
  },
  extraReducers: b => {
    // hydrate
    b.addCase(hydrateAuth.pending, (s) => {
      s.loading = true;
      s.error = null;
      s.hasHydrated = false;
    });
    b.addCase(hydrateAuth.fulfilled, (s, a: PayloadAction<User | null>) => {
      s.loading = false;
      s.currentUser = a.payload ?? null;
      s.hasHydrated = true;                 // 👈 đánh dấu xong
    });
    b.addCase(hydrateAuth.rejected, (s) => {
      s.loading = false;
      s.currentUser = null;
      s.hasHydrated = true;                 // 👈 cũng đánh dấu xong
    });

    // login
    b.addCase(Login.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(Login.fulfilled, (s, a: PayloadAction<User>) => {
      s.loading = false;
      s.currentUser = a.payload;
      s.hasHydrated = true;                 // đã biết trạng thái đăng nhập
    });
    b.addCase(Login.rejected, (s, a) => {
      s.loading = false;
      s.currentUser = null;
      s.error = (a.payload as string) || "Login failed";
      s.hasHydrated = true;
    });

    // logout
    b.addCase(Logout.fulfilled, (s) => {
      s.currentUser = null;
      s.error = null;
      s.hasHydrated = true;
    });
  }
});

export const { clearAuth, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
