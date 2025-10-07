// src/Auth/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

const PrivateRoute: React.FC<{ children: React.ReactElement; role?: string }> = ({ children, role }) => {
  const { currentUser, hasHydrated, loading } = useSelector((s: RootState) => s.auth);

  if (!hasHydrated || loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra đăng nhập…</div>;
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (role && currentUser.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
