// src/redux/UserSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User, LoginDto, AuthResponse } from "../types/User";
import { login as loginApi, me as meApi, logout as logoutApi } from "../service/UserService";

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  hydrated: User | null;
}

const initialState: AuthState = {
  currentUser: null,   // ❗️Không đọc user/token từ localStorage nữa
  loading: false,
  error: null,
  hydrated: null,
};

/** Gọi /user/me để lấy user hiện tại dựa trên cookie 'atk' */
export const hydrateAuth = createAsyncThunk<User | null>(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const user = await meApi();     // withCredentials trong service
      return user;
    } catch (err: any) {
      // 401 -> chưa đăng nhập
      return rejectWithValue(null);
    }
  }
);

/** Đăng nhập: server set cookie HttpOnly; trả về user (có thể kèm token nhưng ta bỏ qua) */
export const Login = createAsyncThunk<User, LoginDto>(
  "auth/login",
  async (dto, { rejectWithValue }) => {
    try {
      const res: AuthResponse = await loginApi(dto); // withCredentials trong service
      // Backend có thể trả { user } hoặc { token, user }; ta chỉ lấy user
      const user = (res as any)?.user ?? res;
      return user as User;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Login failed");
    }
  }
);

/** Đăng xuất: xoá cookie phía server */
export const Logout = createAsyncThunk<void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi(); // withCredentials trong service
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Logout failed");
    }
  }
);

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // optional: clear client state (không gọi API)
    clearAuth(state) {
      state.currentUser = null;
      state.error = null;
      state.loading = false;
    },
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // hydrate
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.loading = false;
        state.currentUser = action.payload ?? null;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.loading = false;
        state.currentUser = null;
      });

    // login
    builder
      .addCase(Login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Login.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(Login.rejected, (state, action) => {
        state.loading = false;
        state.currentUser = null;
        state.error = (action.payload as string) || "Login failed";
      });

    // logout
    builder
      .addCase(Logout.fulfilled, (state) => {
        state.currentUser = null;
        state.error = null;
      });
  },
});

export const { clearAuth, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
