import axiosClient from "../axios/axiosClient";
import type { LoginDto, AuthResponse, User } from "../types/User";

const USER_URL = "/user";

/** Đăng nhập: server sẽ set cookie HttpOnly 'atk' */
export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  // override withCredentials để gửi/nhận cookie
  return await axiosClient.post<AuthResponse>(`${USER_URL}/login`, dto, {
    withCredentials: true,
  });
};

/** Lấy info người dùng hiện tại dựa trên cookie 'atk' (401 nếu chưa đăng nhập) */
export const me = async (): Promise<User> => {
  return await axiosClient.get<User>(`${USER_URL}/me`, {
    withCredentials: true,
  });
};

/** Đăng xuất: server sẽ xoá cookie 'atk' */
export const logout = async (): Promise<void> => {
  await axiosClient.post<void>(`${USER_URL}/logout`, null, {
    withCredentials: true,
  });
};