import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Music, Home, CreditCard } from "lucide-react";
import { FaFacebookMessenger, FaFacebookF } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import Footer from "./Footer";
import Logo from "../data/logo_chamkhoanhkhac.jpg"

const Layout: React.FC = () => {
  const { pathname, search } = useLocation();
  const isActive = (path: string) => pathname === path;
  const hideNav = new URLSearchParams(search).get("embed") === "1";
  const logoUrl = new URL("../data/logo_chamkhoanhkhac.jpg", import.meta.url).href;
  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          "linear-gradient(135deg, rgb(var(--color-bg)) 0%, rgb(var(--color-surface)) 100%)",
      }}
    >
      {/* Navbar */}
      {!hideNav && (
        <nav
          className="sticky top-0 z-50 backdrop-blur"
          style={{
            borderBottom: "1px solid rgba(var(--color-primary), 0.2)",
            backgroundColor: "rgba(var(--color-navbar), 0.8)",
          }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16 items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src={logoUrl}
                  className="h-6 w-6 sm:h-8 sm:w-8 "
                  style={{ color: "rgb(var(--color-primary))" }}
                />
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: "rgb(var(--color-text))" }}
                >
                  Chạm Khoảnh Khắc
                </span>
              </Link>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition"
                  style={{
                    color: isActive("/")
                      ? "rgba(var(--color-primary))"
                      : "rgba(var(--color-text), 0.8)",
                    backgroundColor: isActive("/")
                      ? "rgba(var(--color-primary), 0.2)"
                      : "transparent",
                  }}
                >
                  <Home className="h-4 w-4" />
                  <span>Trang chủ</span>
                </Link>

                <Link
                  to="/booking"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition"
                  style={{
                    color: isActive("/booking")
                      ? "rgb(var(--color-primary))"
                      : "rgb(var(--color-text), 0.8)",
                    backgroundColor: isActive("/booking")
                      ? "rgba(var(--color-primary), 0.2)"
                      : "transparent",
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Đặt vé</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main */}
      <main>
        <Outlet />
        <Footer/>
      </main>

      {/* Floating Contact Buttons */}
      <div className="fixed bottom-5 right-5 flex flex-col items-center gap-3 z-[60] contact-float">
        {/* Zalo */}
        <a
          href="https://zalo.me/0827919555"
          target="_blank"
          rel="noreferrer"
          title="Liên hệ Zalo"
          className="contact-btn bg-blue-500"
        >
          <SiZalo className="text-white text-2xl sm:text-3xl" />
        </a>

        {/* Messenger */}
        <a
          href="https://m.me/108587363861682"
          target="_blank"
          rel="noreferrer"
          title="Chat Messenger"
          className="contact-btn bg-[#0084FF]"
        >
          <FaFacebookMessenger className="text-white text-2xl sm:text-3xl" />
        </a>

        {/* Facebook */}
        <a
          href="https://www.facebook.com/chamshowmusic"
          target="_blank"
          rel="noreferrer"
          title="Trang Facebook"
          className="contact-btn bg-[#1877F2]"
        >
          <FaFacebookF className="text-white text-xl sm:text-2xl" />
        </a>
      </div>
    </div>
  );
};

export default Layout;
