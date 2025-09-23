import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // layout client
import LayoutAdmin from './components/LayoutAdmin'; // layout admin
import Home from './pages/Home';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import { BookingProvider } from './contexts/BookingContext';
import Dashboard from './pages/Dashboard';

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
          </Route>

          {/* ADMIN LAYOUT */}
          <Route element={<LayoutAdmin />}>
          <Route path='/admin' element= {<Dashboard/>}/>
          </Route>
        </Routes>
      </Router>
    </BookingProvider>
  );
}

export default App;
