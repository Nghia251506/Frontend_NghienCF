// src/pages/Login.tsx
import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../redux/store";
import { Login } from "../redux/UserSlice";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [passWord, setPassWord] = useState("");
  const [showPw, setShowPw] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return toast.error("Vui lòng nhập tài khoản!");
    if (!passWord.trim()) return toast.error("Vui lòng nhập mật khẩu!");
    if (passWord.length < 6) return toast.error("Mật khẩu phải ít nhất 6 ký tự!");

    dispatch(Login({ userName, passWord }))
      .unwrap()
      .then(() => {
        toast.success("Đăng nhập thành công! 🎉");
        navigate("/admin");
      })
      .catch((err) => {
        toast.error(err || "Sai tài khoản hoặc mật khẩu!");
      });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: "rgb(var(--color-bg))" }}
    >
      {/* background image mờ */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')",
        }}
      />
      {/* overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,.5)" }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-lg"
        style={{
          backgroundColor: "color-mix(in srgb, rgb(var(--color-surface)) 85%, #000 15%)",
          border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 35%, transparent)",
        }}
      >
        <h1
          className="text-3xl font-bold text-center mb-6"
          style={{ color: "rgb(var(--color-primary))" }}
        >
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              className="block text-sm mb-2"
              style={{ color: "rgb(var(--color-muted))" }}
            >
              Tài khoản
            </label>
            <div
              className="flex items-center rounded-lg px-3 py-2 focus-within:ring-2"
              style={{
                backgroundColor: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "rgb(var(--color-text))",
                // ring khi focus
                boxShadow: "0 0 0 0 rgba(0,0,0,0)",
              }}
            >
              <FaUser className="opacity-70 mr-2" />
              <input
                type="text"
                placeholder="Nhập tài khoản"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-transparent outline-none"
                style={{ color: "rgb(var(--color-text))" }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-sm mb-2"
              style={{ color: "rgb(var(--color-muted))" }}
            >
              Mật khẩu
            </label>
            <div
              className="flex items-center rounded-lg px-3 py-2 focus-within:ring-2"
              style={{
                backgroundColor: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "rgb(var(--color-text))",
              }}
            >
              <FaLock className="opacity-70 mr-2" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={passWord}
                onChange={(e) => setPassWord(e.target.value)}
                className="w-full bg-transparent outline-none"
                style={{ color: "rgb(var(--color-text))" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="ml-2 p-1 rounded hover:bg-white/10"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? (
                  <EyeOff size={18} style={{ color: "rgb(var(--color-text))" }} />
                ) : (
                  <Eye size={18} style={{ color: "rgb(var(--color-text))" }} />
                )}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-2 rounded-lg shadow-md transition"
            style={{
              color: "#000",
              backgroundImage:
                "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p
          className="text-sm text-center mt-6"
          style={{ color: "rgb(var(--color-muted))" }}
        >
          © {new Date().getFullYear()} Chạm Khoảnh Khắc
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
