import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // layout client
import LayoutAdmin from './components/LayoutAdmin'; // layout admin
import Home from './pages/Home';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import { BookingProvider } from './contexts/BookingContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { ToastContainer } from "react-toastify";
// import AddShow from './pages/AddShow';
// import ListBooking from './pages/ListBooking';
import PrivateRoute from './Auth/PrivateRoute';
import AddShow from './pages/AddShow';
import ListShow from './pages/ListShow';
import ListOrder from './pages/ListOrder';
import ListType from './pages/ListType';
import TicketAdmin from './pages/TicketAdmin';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTheme } from "./redux/ThemeSlice";
import { applyTheme } from "./applyTheme";
import type { RootState, AppDispatch } from "./redux/store";
import DesignTheme from './pages/DesignTheme';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.theme.current);

  useEffect(() => { dispatch(fetchTheme()); }, [dispatch]);
  useEffect(() => { if (theme) applyTheme(theme); }, [theme]);

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
              </PrivateRoute>}>
            <Route index element={<Dashboard />} /> {/* /admin */}
            <Route path="dashboard" element={<Dashboard />} /> {/* /admin/dashboard */}
            <Route path='addshow' element={<AddShow/>}/>
            <Route path='listshow' element={<ListShow/>}/>
            <Route path='listorder' element={<ListOrder/>}/>
            <Route path='listtype' element={<ListType/>}/>
            <Route path='listticket' element={<TicketAdmin/>}/>
            <Route path='design' element={<DesignTheme/>}/>
          </Route>

        </Routes>
      </Router>
    </BookingProvider>
  );
}
