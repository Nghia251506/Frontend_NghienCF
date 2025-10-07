// src/App.tsx
import React, { useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import LayoutAdmin from "./components/LayoutAdmin";
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

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./redux/store";
import { fetchTheme } from "./redux/ThemeSlice";
import { applyTheme } from "./applyTheme";
import PrivateRoute from "./Auth/PrivateRoute";
import { hydrateAuth } from "./redux/UserSlice"; // 👈 thunk hydrate

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { current: theme, loading: themeLoading } = useSelector((s: RootState) => s.theme);
  const { loading: authLoading } = useSelector((s: RootState) => s.auth);
  const [bootstrapped, setBootstrapped] = useState(false);

  // 1) hydrate phiên dựa trên cookie
  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  // 2) nạp theme đang active
  useEffect(() => {
    dispatch(fetchTheme());
  }, [dispatch]);

  // 3) bơm biến theme càng sớm càng tốt + đợi cả auth/theme xong mới render app
  useLayoutEffect(() => {
    if (theme) applyTheme(theme);
    if (!themeLoading && !authLoading) setBootstrapped(true);
  }, [theme, themeLoading, authLoading]);

  if (!bootstrapped) {
    // Splash rất nhẹ để tránh flash
    return <div style={{ minHeight: "100vh", background: "rgb(var(--color-bg))" }} />;
  }

  return (
    <Router>
      <Routes>
        {/* CLIENT */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ADMIN - BỌC PRIVATE */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
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
  );
}
