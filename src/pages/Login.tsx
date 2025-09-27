import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../redux/store";
import { Login } from "../redux/UserSlice";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [passWord, setPassWord] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("👉 Data gửi đi:", { userName, passWord });
    // ✅ validate trước khi gọi API
    if (!userName.trim()) {
      toast.error("Vui lòng nhập tài khoản!");
      return;
    }
    if (!passWord.trim()) {
      toast.error("Vui lòng nhập mật khẩu!");
      return;
    }
    if (passWord.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự!");
      return;
    }

    // Nếu validate OK thì gọi API login
    dispatch(Login({ userName, passWord }))
      .unwrap()
      .then((res) => {
        toast.success("Đăng nhập thành công! 🎉");
        navigate("/admin");
      })
      .catch((err) => {
        toast.error(err || "Sai tài khoản hoặc mật khẩu!");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')",
        }}
      ></div>
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="w-full z-10 max-w-md bg-[#1a1a1a] p-8 rounded-2xl shadow-lg border border-[#f59e0b]">
        <h1 className="text-3xl font-bold text-center text-[#f59e0b] mb-6">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Tài khoản</label>
            <div className="flex items-center bg-[#262626] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f59e0b]">
              <FaUser className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Nhập tài khoản"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-100"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Mật khẩu</label>
            <div className="flex items-center bg-[#262626] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f59e0b]">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={passWord}
                onChange={(e) => setPassWord(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-100"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold py-2 rounded-lg shadow-md hover:opacity-90 transition"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          © {new Date().getFullYear()} Concert Night
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
