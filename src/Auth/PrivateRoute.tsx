// src/Auth/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, hasHydrated, loading } = useSelector((s: RootState) => s.auth);

  // Trong lúc Redux chưa load xong user => hiện màn hình chờ
  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Đang kiểm tra đăng nhập…
      </div>
    );
  }

  // Nếu chưa đăng nhập => đẩy về trang login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập => render children
  return children;
};

export default PrivateRoute;
