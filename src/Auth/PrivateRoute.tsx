// src/Auth/PrivateRoute.tsx
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { hydrateAuth } from "../redux/UserSlice";

const PrivateRoute: React.FC<{ children: React.ReactElement; role?: string }> = ({ children, role }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, hydrated, loading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!hydrated) dispatch(hydrateAuth());
  }, [hydrated, dispatch]);

  if (!hydrated || loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra đăng nhập…</div>;
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (role && currentUser.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
