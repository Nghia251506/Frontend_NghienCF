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
// import AddShow from './pages/AddShow';
// import ListBooking from './pages/ListBooking';

function App() {
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
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route index element={<Dashboard />} /> {/* /admin */}
            <Route path="dashboard" element={<Dashboard />} /> {/* /admin/dashboard */}
          </Route>
        </Routes>
      </Router>
    </BookingProvider>
  );
}

export default App;
