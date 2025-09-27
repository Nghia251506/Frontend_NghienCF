import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, LoginDto, AuthResponse } from "../types/User";
import { login } from "../service/UserService";

interface AuthState {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") as string)
    : null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

// thunk login
export const Login = createAsyncThunk<AuthResponse, LoginDto>(
  "auth/login",
  async (dto, { rejectWithValue }) => {
    try {
      const res: AuthResponse = await login(dto);

      // Lưu vào localStorage
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(Login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        Login.fulfilled,
        (state, action: PayloadAction<AuthResponse>) => {
          state.loading = false;
          state.currentUser = action.payload.user;
          state.token = action.payload.token;
        }
      )
      .addCase(Login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });
  },
});

export const { logout, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
