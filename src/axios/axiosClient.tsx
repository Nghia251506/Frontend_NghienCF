// src/api/axiosClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// request interceptor
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    // Header kiểu AxiosHeaders có set()
    config.headers = config.headers ?? {};
  }
  return config;
});

// response interceptor -> luôn trả .data
axiosClient.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);

// 👉 Khai báo lại kiểu để .get/.post trả Promise<T> (không phải AxiosResponse<T>)
type DataReturningAxios = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
} & AxiosInstance;

export default axiosClient as DataReturningAxios;
