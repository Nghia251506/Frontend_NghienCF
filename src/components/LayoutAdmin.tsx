import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState , AppDispatch } from "../redux/store";
import { logout } from "../redux/UserSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./Footer";

// Icons
import {
  Menu, X, Home, BarChart3, Palette, LogOut, ChevronRight,
  Ticket, List, PlusSquare
} from "lucide-react";
import { FaMusic } from "react-icons/fa";

// ---- Nav config ----
type NavItem = {
  label: string;
  to?: string;             // when no children
  icon?: React.ReactNode;
  children?: { label: string; to: string }[];
};

const NAV: NavItem[] = [
  { label: "Thống kê", to: "/admin/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  {
    label: "Quản lý show",
    icon: <FaMusic className="w-4 h-4" />,
    children: [
      { label: "Danh sách combo", to: "/admin/listtype" },
      { label: "Thêm show diễn", to: "/admin/addshow" },
      { label: "Danh sách đặt", to: "/admin/listorder" },
      { label: "Danh sách show diễn", to: "/admin/listshow" },
      { label: "Danh sách vé đã đặt", to: "/admin/listticket" },
    ],
  },
  { label: "Thiết kế", to: "/admin/design", icon: <Palette className="w-4 h-4" /> },
];

// ---- Helpers ----
const isActive = (pathname: string, to?: string) =>
  !!to && (pathname === to || pathname.startsWith(to + "/"));

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
    <Home className="w-3.5 h-3.5" />
    <span>Admin</span>
    <ChevronRight className="w-3.5 h-3.5" />
    <span className="text-gray-200">{title}</span>
  </div>
);

const LayoutAdmin: React.FC = () => {
  const [open, setOpen] = useState(false);           // mobile aside
  const [expandShow, setExpandShow] = useState(true); // toggle group "Quản lý show"
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loggingOut, setLoggingOut] = useState(false);

  const { currentUser } = useSelector((s: RootState) => s.auth);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await dispatch(logout());           // ✅ chờ thunk hoàn tất
      toast.success("Đăng xuất thành công!");
      navigate("/login", { replace: true });       // ✅ quay về login
    } catch (e: any) {
      toast.error(e?.message || "Đăng xuất thất bại");
    } finally {
      setLoggingOut(false);
    }
  };

  const goto = (to: string) => {
    navigate(to);
    // toast.info(`Đang chuyển đến: ${to.replace("/admin/", "")}`);
    setOpen(false);
  };

  // Lấy tiêu đề section theo route để hiển thị trên header nhỏ
  const currentTitle =
    NAV.find(n => isActive(pathname, n.to))?.label ||
    NAV.find(n => n.children?.some(c => isActive(pathname, c.to)))?.label ||
    "Bảng điều khiển";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur">
        {/* full width, không max-w */}
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile: toggle sidebar */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/10"
              onClick={() => setOpen(s => !s)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="font-semibold tracking-wide">
              Admin • Chạm Khoảnh Khắc
            </Link>
          </div>

          {/* User info + Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-300">
              {currentUser?.userName ? `Xin chào, ${currentUser.userName}` : "Admin"}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Shell: full width desktop */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 lg:gap-6 py-4 lg:py-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block sticky top-16 self-start h-[calc(100vh-4rem)] overflow-auto">
            <nav className="p-3 rounded-2xl border border-white/10 bg-white/5">
              <div className="mb-3 px-2 text-xs uppercase tracking-wider text-gray-400">
                Điều hướng
              </div>

              <div className="flex flex-col gap-1">
                {/* Dashboard */}
                <button
                  onClick={() => goto("/admin/dashboard")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                    ${isActive(pathname, "/admin/dashboard")
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "text-gray-300 hover:bg-white/5"}
                  `}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Thống kê</span>
                </button>

                {/* Quản lý show (group) */}
                <div className="mt-1">
                  <button
                    onClick={() => setExpandShow(s => !s)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5"
                  >
                    <span className="flex items-center gap-3">
                      <FaMusic className="w-4 h-4" />
                      <span className="text-sm">Quản lý show</span>
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expandShow ? "rotate-90" : ""}`}
                    />
                  </button>
                  {expandShow && (
                    <div className="mt-1 ml-6 flex flex-col gap-1">
                      <button
                        onClick={() => goto("/admin/listtype")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                          ${isActive(pathname, "/admin/listtype")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-gray-300 hover:bg-white/5"}
                        `}
                      >
                        <List className="w-4 h-4" />
                        Danh sách combo
                      </button>
                      <button
                        onClick={() => goto("/admin/addshow")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                          ${isActive(pathname, "/admin/addshow")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-gray-300 hover:bg-white/5"}
                        `}
                      >
                        <PlusSquare className="w-4 h-4" />
                        Thêm show diễn
                      </button>
                      <button
                        onClick={() => goto("/admin/listorder")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                          ${isActive(pathname, "/admin/listorder")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-gray-300 hover:bg-white/5"}
                        `}
                      >
                        <Ticket className="w-4 h-4" />
                        Danh sách đặt
                      </button>
                      <button
                        onClick={() => goto("/admin/listshow")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                          ${isActive(pathname, "/admin/listshow")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-gray-300 hover:bg-white/5"}
                        `}
                      >
                        <List className="w-4 h-4" />
                        Danh sách show diễn
                      </button>
                      <button
                        onClick={() => goto("/admin/listticket")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                          ${isActive(pathname, "/admin/listticket")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-gray-300 hover:bg-white/5"}
                        `}
                      >
                        <Ticket className="w-4 h-4" />
                        Danh sách vé đã đặt
                      </button>
                    </div>
                  )}
                </div>

                {/* Thiết kế */}
                <button
                  onClick={() => goto("/admin/design")}
                  className={`mt-1 flex items-center gap-3 px-3 py-2 rounded-lg transition
                    ${isActive(pathname, "/admin/design")
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "text-gray-300 hover:bg-white/5"}
                  `}
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-sm">Thiết kế</span>
                </button>
              </div>

              {/* Logout (desktop) */}
              <div className="mt-6 border-t border-white/10 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-2 text-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Sidebar - Mobile Overlay */}
          {open && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setOpen(false)}
              />
              <aside className="absolute left-0 top-0 h-full w-72 bg-neutral-900 border-r border-white/10 p-3 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="font-semibold">Menu</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-md hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-2">
                  <button
                    onClick={() => goto("/admin/dashboard")}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition
                      ${isActive(pathname, "/admin/dashboard")
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "text-gray-300 hover:bg-white/5"}
                    `}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Thống kê</span>
                  </button>

                  <div className="mt-1">
                    <button
                      onClick={() => setExpandShow(s => !s)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3">
                        <FaMusic className="w-4 h-4" />
                        <span className="text-sm">Quản lý show</span>
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${expandShow ? "rotate-90" : ""}`}
                      />
                    </button>
                    {expandShow && (
                      <div className="mt-1 ml-6 flex flex-col gap-1">
                        <button
                          onClick={() => goto("/admin/listtype")}
                          className={`text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            ${isActive(pathname, "/admin/listtype")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "text-gray-300 hover:bg-white/5"}
                          `}
                        >
                          <List className="w-4 h-4" />
                          Danh sách combo
                        </button>
                        <button
                          onClick={() => goto("/admin/addshow")}
                          className={`text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            ${isActive(pathname, "/admin/addshow")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "text-gray-300 hover:bg-white/5"}
                          `}
                        >
                          <PlusSquare className="w-4 h-4" />
                          Thêm show diễn
                        </button>
                        <button
                          onClick={() => goto("/admin/listorder")}
                          className={`text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            ${isActive(pathname, "/admin/listorder")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "text-gray-300 hover:bg-white/5"}
                          `}
                        >
                          <Ticket className="w-4 h-4" />
                          Danh sách đặt
                        </button>
                        <button
                          onClick={() => goto("/admin/listshow")}
                          className={`text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            ${isActive(pathname, "/admin/listshow")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "text-gray-300 hover:bg-white/5"}
                          `}
                        >
                          <List className="w-4 h-4" />
                          Danh sách show diễn
                        </button>
                        <button
                          onClick={() => goto("/admin/listticket")}
                          className={`text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            ${isActive(pathname, "/admin/listticket")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "text-gray-300 hover:bg-white/5"}
                          `}
                        >
                          <Ticket className="w-4 h-4" />
                          Danh sách vé đã đặt
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-2 text-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </nav>
              </aside>
            </div>
          )}

          {/* Main (full width area) */}
          <main className="pb-10 lg:pb-12 min-w-0">
            <SectionTitle title={currentTitle} />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 lg:p-6">
              {/* gợi ý: thêm wrapper cho bảng lớn để kéo ngang trên mobile/ipad */}
              <div className="w-full overflow-x-auto">
                <Outlet />
              </div>
            </div>
            <Footer/>
          </main>
        </div>
      </div>

      {/* Toast */}
      <ToastContainer position="top-right" autoClose={2500} />
      
       </div>
  );
};

export default LayoutAdmin;
