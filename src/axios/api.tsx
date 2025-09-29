// src/api/api.ts
import axiosClient from "./axiosClient";
import type { AxiosRequestConfig } from "axios";

export const api = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return axiosClient.get(url, config) as unknown as Promise<T>;
  },
  post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return axiosClient.post(url, data, config) as unknown as Promise<T>;
  },
  put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return axiosClient.put(url, data, config) as unknown as Promise<T>;
  },
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return axiosClient.patch(url, data, config) as unknown as Promise<T>;
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return axiosClient.delete(url, config) as unknown as Promise<T>;
  },
};
