import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Music, Home, CreditCard } from 'lucide-react';
import { IoMdLogIn } from "react-icons/io";

const Layout: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur-lg border-b border-yellow-500/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <Music className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              <span className="text-lg sm:text-xl font-bold text-white">Chạm Khoảnh Khắc</span>
            </div>
            
            <div className="flex space-x-2 sm:space-x-4 lg:space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive('/') 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50'
                }`}
              >
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Trang chủ</span>
              </Link>
              
              <Link
                to="/booking"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive('/booking') 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50'
                }`}
              >
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Đặt vé</span>
              </Link>
              <Link
                to="/login"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive('/login') 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50'
                }`}
              >
                <span className="hidden xs:inline"></span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet /> {/* React Router sẽ render Home / Booking / Payment ở đây */}
      </main>
    </div>
  );
};

export default Layout;
