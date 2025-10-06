// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";          // layout client
import LayoutAdmin from "./components/LayoutAdmin"; // layout admin

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AddShow from "./pages/AddShow";
import ListShow from "./pages/ListShow";
import ListOrder from "./pages/ListOrder";
import ListType from "./pages/ListType";
import TicketAdmin from "./pages/TicketAdmin";
import DesignTheme from "./pages/DesignTheme";

import { BookingProvider } from "./contexts/BookingContext";
import PrivateRoute from "./Auth/PrivateRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchTheme } from "./redux/ThemeSlice";
import { applyTheme } from "./applyTheme";

// ✅ dùng hooks typed để TS không kêu ở theme
import { useAppDispatch, useAppSelector } from "./redux/hook";

export default function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.current);

  useEffect(() => {
    // gọi API lấy theme đang áp dụng (global hoặc theo show nếu bạn truyền thêm tham số)
    dispatch(fetchTheme());
  }, [dispatch]);

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  return (
    <BookingProvider>
      <Router>
        <Routes>
          {/* CLIENT LAYOUT */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* ADMIN LAYOUT */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <LayoutAdmin />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="addshow" element={<AddShow />} />
            <Route path="listshow" element={<ListShow />} />
            <Route path="listorder" element={<ListOrder />} />
            <Route path="listtype" element={<ListType />} />
            <Route path="listticket" element={<TicketAdmin />} />
            <Route path="design" element={<DesignTheme />} />
          </Route>
        </Routes>
      </Router>

      {/* Toast ở root để dùng mọi nơi */}
      <ToastContainer position="top-right" autoClose={2500} />
    </BookingProvider>
  );
}
