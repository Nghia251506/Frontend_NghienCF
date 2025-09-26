import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login with:", email, password);
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90">
        {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')", // đổi thành path ảnh concert của bạn
        }}
      ></div>

      {/* Overlay mờ màu đen */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="w-full z-10 max-w-md bg-[#1a1a1a] p-8 rounded-2xl shadow-lg border border-[#f59e0b]">
        <h1 className="text-3xl font-bold text-center text-[#f59e0b] mb-6">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Tài khoản
            </label>
            <div className="flex items-center bg-[#262626] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f59e0b]">
              <FaUser className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Nhập tài khoản"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-100"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Mật khẩu
            </label>
            <div className="flex items-center bg-[#262626] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f59e0b]">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-100"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold py-2 rounded-lg shadow-md hover:opacity-90 transition"
          >
            Đăng nhập
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm text-center mt-6">
          © {new Date().getFullYear()} Concert Night
        </p>
      </div>
    </div>
  );
};

export default Login;
