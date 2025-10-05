import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Music, Home, CreditCard } from "lucide-react";
import { IoMdLogIn } from "react-icons/io";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-black to-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-primary/20 bg-navbar/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2">
              <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-white text-lg sm:text-xl font-bold">
                Chạm Khoảnh Khắc
              </span>
            </Link>

            {/* Right links */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition
                ${
                  isActive("/")
                    ? "bg-primary/20 text-primary"
                    : "text-white/80 hover:text-primary hover:bg-white/10"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/booking"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition
                ${
                  isActive("/booking")
                    ? "bg-primary/20 text-primary"
                    : "text-white/80 hover:text-primary hover:bg-white/10"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Đặt vé</span>
              </Link>

              <Link
                to="/login"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition
                ${
                  isActive("/login")
                    ? "bg-primary/20 text-primary"
                    : "text-white/80 hover:text-primary hover:bg-white/10"
                }`}
              >
                <IoMdLogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
