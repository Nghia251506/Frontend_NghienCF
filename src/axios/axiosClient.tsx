// src/api/axiosClient.ts
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5135/api", // đổi thành URL backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // nếu backend có cookie/session
});

// Interceptor cho request
axiosClient.interceptors.request.use(
  (config) => {
    // ví dụ thêm token vào header
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error(error);
    return Promise.reject(error);
  }
);

export default axiosClient;
