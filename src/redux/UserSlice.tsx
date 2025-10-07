// src/redux/UserSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User, LoginDto, AuthResponse } from "../types/User";
import { login as loginApi } from "../service/UserService";
import axiosClient from "../axios/axiosClient";

type AuthState = {
  currentUser: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  hasHydrated: boolean;
};

const STORAGE_TOKEN = "access_token";
const STORAGE_USER = "auth_user";

/** Đồng bộ header Authorization cho axios */
const setAuthHeader = (token: string | null) => {
  if (token) {
    axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common["Authorization"];
  }
};

/** Helpers lưu/đọc/xoá storage */
const saveAuth = (user: User, token: string) => {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  setAuthHeader(token);
};
const clearAuthStorage = () => {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  setAuthHeader(null);
};
const loadAuth = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem(STORAGE_TOKEN);
  const rawUser = localStorage.getItem(STORAGE_USER);
  const user = rawUser ? (JSON.parse(rawUser) as User) : null;
  if (token) setAuthHeader(token);
  return { user, token };
};

const initialState: AuthState = {
  currentUser: null,
  accessToken: null,
  loading: false,
  error: null,
  hasHydrated: false,
};

/** Khởi tạo state từ localStorage (không gọi server) */
export const hydrateAuth = createAsyncThunk(
  "auth/hydrate",
  async () => {
    const { user, token } = loadAuth();
    return { user, token };
  }
);

/** Login: nhận về { user, accessToken } hoặc tương tự */
export const Login = createAsyncThunk<User, LoginDto>(
  "auth/login",
  async (dto, { rejectWithValue }) => {
    try {
      const res: AuthResponse = await loginApi(dto);
      // Tương thích nhiều backend: có thể trả { user, accessToken } hoặc { user, token } hoặc { ...userFields }
      const accessToken =
        (res as any).accessToken ??
        (res as any).token ??
        (res as any).access_token ??
        null;

      const user: User =
        (res as any).user ??
        (res as unknown as User); // fallback: res chính là User

      if (!accessToken) {
        // Nếu backend không trả token, hãy đảm bảo loginApi trả token; nếu cố tình không dùng token, vẫn cho login "tạm"
        // nhưng khuyến nghị backend trả token rõ ràng.
        console.warn("Login response missing accessToken; proceeding without token.");
      } else {
        saveAuth(user, accessToken);
      }

      return user;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Login failed";
      return rejectWithValue(msg);
    }
  }
);

/** Logout: client-side clear (không gọi API) */
export const Logout = createAsyncThunk<void>(
  "auth/logout",
  async () => {
    clearAuthStorage();
  }
);

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Xoá sạch state (dùng khi muốn force logout) */
    clearAuth(state) {
      state.currentUser = null;
      state.accessToken = null;
      state.error = null;
      state.loading = false;
      state.hasHydrated = true;
      clearAuthStorage();
    },
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    // hydrate
    b.addCase(hydrateAuth.pending, (s) => {
      s.loading = true;
      s.error = null;
      s.hasHydrated = false;
    });
    b.addCase(
      hydrateAuth.fulfilled,
      (s, a: PayloadAction<{ user: User | null; token: string | null }>) => {
        s.loading = false;
        s.currentUser = a.payload.user;
        s.accessToken = a.payload.token;
        s.hasHydrated = true;
      }
    );
    b.addCase(hydrateAuth.rejected, (s) => {
      s.loading = false;
      s.currentUser = null;
      s.accessToken = null;
      s.hasHydrated = true;
    });

    // login
    b.addCase(Login.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(Login.fulfilled, (s, a: PayloadAction<User>) => {
      s.loading = false;
      s.currentUser = a.payload;
      // accessToken đã được set trong saveAuth(); đồng bộ lại từ storage để hiển thị
      s.accessToken = localStorage.getItem(STORAGE_TOKEN);
      s.hasHydrated = true;
    });
    b.addCase(Login.rejected, (s, a) => {
      s.loading = false;
      s.currentUser = null;
      s.accessToken = null;
      s.error = (a.payload as string) || "Login failed";
      s.hasHydrated = true;
    });

    // logout
    b.addCase(Logout.fulfilled, (s) => {
      s.currentUser = null;
      s.accessToken = null;
      s.error = null;
      s.hasHydrated = true;
    });
  },
});

export const { clearAuth, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
