import axiosClient from "../axios/axiosClient";
import { LoginDto, AuthResponse } from "../types/User";
const USER_URL = "/user";


// export const login = async (dto: LoginDto): Promise<AuthResponse> => {
//   const res = await axiosClient.post<AuthResponse>(`${USER_URL}/login`, dto);
//   return res.data;
// };
export const login = async (dto: LoginDto): Promise<AuthResponse> => {

  try {
    const res = await axiosClient.post<AuthResponse>(`${USER_URL}/login`, dto);
    return res;
  } catch (error: any) {
    throw error; // nhớ throw lại để redux nhận được rejected
  }
};
