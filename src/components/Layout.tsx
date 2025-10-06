// src/components/Layout.tsx
import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Music, Home, CreditCard } from "lucide-react";
import { IoMdLogIn } from "react-icons/io";

const Layout: React.FC = () => {
  const { pathname, search } = useLocation();
  const isActive = (path: string) => pathname === path;

  // Ẩn navbar khi preview trong iframe: /?embed=1
  const hideNav = new URLSearchParams(search).get("embed") === "1";

  return (
    <div
      className="min-h-screen"
      // nền theo theme (gradient nhẹ)
      style={{
        // các biến này do applyTheme() set: --color-bg / --color-surface / --color-primary / ...
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
              {/* Brand */}
              <Link to="/" className="flex items-center gap-2">
                <Music
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  style={{ color: "rgb(var(--color-primary))" }}
                />
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: "rgb(var(--color-text))" }}
                >
                  Chạm Khoảnh Khắc
                </span>
              </Link>

              {/* Right links */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition"
                  style={{
                    color: isActive("/")
                      ? "rgb(var(--color-primary))"
                      : "rgba(var(--color-text), 0.8)",
                    backgroundColor: isActive("/")
                      ? "rgba(var(--color-primary), 0.2)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    !isActive("/") &&
                    ((e.currentTarget.style.color = "rgb(var(--color-primary))"),
                    (e.currentTarget.style.backgroundColor =
                      "rgba(var(--color-text), 0.1)"))
                  }
                  onMouseLeave={(e) =>
                    !isActive("/") &&
                    ((e.currentTarget.style.color =
                      "rgba(var(--color-text), 0.8)"),
                    (e.currentTarget.style.backgroundColor = "transparent"))
                  }
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
                      : "rgba(var(--color-text), 0.8)",
                    backgroundColor: isActive("/booking")
                      ? "rgba(var(--color-primary), 0.2)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    !isActive("/booking") &&
                    ((e.currentTarget.style.color = "rgb(var(--color-primary))"),
                    (e.currentTarget.style.backgroundColor =
                      "rgba(var(--color-text), 0.1)"))
                  }
                  onMouseLeave={(e) =>
                    !isActive("/booking") &&
                    ((e.currentTarget.style.color =
                      "rgba(var(--color-text), 0.8)"),
                    (e.currentTarget.style.backgroundColor = "transparent"))
                  }
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Đặt vé</span>
                </Link>

                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base transition"
                  style={{
                    color: isActive("/login")
                      ? "rgb(var(--color-primary))"
                      : "rgba(var(--color-text), 0.8)",
                    backgroundColor: isActive("/login")
                      ? "rgba(var(--color-primary), 0.2)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    !isActive("/login") &&
                    ((e.currentTarget.style.color = "rgb(var(--color-primary))"),
                    (e.currentTarget.style.backgroundColor =
                      "rgba(var(--color-text), 0.1)"))
                  }
                  onMouseLeave={(e) =>
                    !isActive("/login") &&
                    ((e.currentTarget.style.color =
                      "rgba(var(--color-text), 0.8)"),
                    (e.currentTarget.style.backgroundColor = "transparent"))
                  }
                >
                  <IoMdLogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
