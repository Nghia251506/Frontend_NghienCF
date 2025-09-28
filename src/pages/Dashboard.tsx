import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchBookings } from "../redux/BookingSlice";
import { fetchShows } from "../redux/ShowSlice";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, Ticket, DollarSign } from "lucide-react";

// ---------- Local helpers ----------
function toDateSafe(x: unknown): Date | null {
  if (!x) return null;
  const d = new Date(x as any);
  return isNaN(+d) ? null : d;
}

function fmtMoney(n: number) {
  return n.toLocaleString("vi-VN");
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ISO week key: e.g. 2025-W05
function isoWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // 1..7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // to Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ---------- Component ----------
const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const bookings = useSelector((s: RootState) => s.bookings.items);
  const loadingBookings = useSelector((s: RootState) => s.bookings.loading);
  const shows = useSelector((s: RootState) => s.shows.items);
  const loadingShows = useSelector((s: RootState) => s.shows.loading);

  const [onlyPaid, setOnlyPaid] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    dispatch(fetchShows());
    dispatch(fetchBookings());
  }, [dispatch]);

  const showsMap = useMemo(() => {
    const m = new Map<number, string>();
    shows.forEach((s: any) => m.set(s.id, s.title ?? `Show #${s.id}`));
    return m;
  }, [shows]);

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return bookings.filter((b: any) => {
      if (onlyPaid && (b.paymentStatus ?? "").toLowerCase() !== "paid") return false;
      const d = toDateSafe(b.paymentTime) || toDateSafe(b.createdAt);
      if (!d) return true; // nếu không có thời gian, cho qua
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [bookings, onlyPaid, fromDate, toDate]);

  // ----------- KPIs -----------
  const totalRevenue = useMemo(
    () => filtered.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
    [filtered]
  );
  const totalTickets = useMemo(
    () => filtered.reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0),
    [filtered]
  );

  // ----------- Revenue by Show -----------
  const revenueByShow = useMemo(() => {
    const acc = new Map<number, { showId: number; showName: string; revenue: number }>();
    for (const b of filtered as any[]) {
      const key = b.showId as number;
      const cur = acc.get(key) ?? { showId: key, showName: showsMap.get(key) ?? `Show #${key}`, revenue: 0 };
      cur.revenue += Number(b.totalAmount) || 0;
      acc.set(key, cur);
    }
    // stable order by show name
    return Array.from(acc.values()).sort((a, b) => a.showName.localeCompare(b.showName));
  }, [filtered, showsMap]);

  // ----------- Tickets sold by Show -----------
  const ticketsByShow = useMemo(() => {
    const acc = new Map<number, { showId: number; showName: string; tickets: number }>();
    for (const b of filtered as any[]) {
      const key = b.showId as number;
      const cur = acc.get(key) ?? { showId: key, showName: showsMap.get(key) ?? `Show #${key}`, tickets: 0 };
      cur.tickets += Number(b.quantity) || 0;
      acc.set(key, cur);
    }
    return Array.from(acc.values()).sort((a, b) => a.showName.localeCompare(b.showName));
  }, [filtered, showsMap]);

  // ----------- Revenue by Month -----------
  const revenueByMonth = useMemo(() => {
    const acc = new Map<string, number>();
    for (const b of filtered as any[]) {
      const d = toDateSafe(b.paymentTime) || toDateSafe(b.createdAt);
      if (!d) continue;
      const k = monthKey(d);
      acc.set(k, (acc.get(k) ?? 0) + (Number(b.totalAmount) || 0));
    }
    return Array.from(acc.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  // ----------- Revenue by Week -----------
  const revenueByWeek = useMemo(() => {
    const acc = new Map<string, number>();
    for (const b of filtered as any[]) {
      const d = toDateSafe(b.paymentTime) || toDateSafe(b.createdAt);
      if (!d) continue;
      const k = isoWeekKey(d);
      acc.set(k, (acc.get(k) ?? 0) + (Number(b.totalAmount) || 0));
    }
    return Array.from(acc.entries())
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  const loading = loadingBookings || loadingShows;

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Thống kê & Báo cáo</h1>
          <p className="text-gray-400 mt-2">Doanh thu và số vé theo show, theo tuần, theo tháng.</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-4">
            <label className="block text-sm text-gray-300 mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-4">
            <label className="block text-sm text-gray-300 mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Chỉ tính đơn đã thanh toán</p>
              <p className="text-xs text-gray-400">(paymentStatus = paid)</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-yellow-500 transition" />
            </label>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <DollarSign className="text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Doanh thu</p>
                <p className="text-white font-bold text-lg">{fmtMoney(totalRevenue)} đ</p>
              </div>
            </div>
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <Ticket className="text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Số vé</p>
                <p className="text-white font-bold text-lg">{fmtMoney(totalTickets)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by show */}
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-yellow-400" />
              <h3 className="text-white font-semibold">Doanh thu theo show</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByShow} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="showName" interval={0} tick={{ fontSize: 12 }} angle={-10} height={50} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                  <Tooltip formatter={(v: any) => `${fmtMoney(Number(v))} đ`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tickets by show */}
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="text-yellow-400" />
              <h3 className="text-white font-semibold">Số vé đã bán theo show</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByShow} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="showName" interval={0} tick={{ fontSize: 12 }} angle={-10} height={50} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" name="Vé" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by week */}
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-yellow-400" />
              <h3 className="text-white font-semibold">Doanh thu theo tuần (ISO)</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                  <Tooltip formatter={(v: any) => `${fmtMoney(Number(v))} đ`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by month */}
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-yellow-400" />
              <h3 className="text-white font-semibold">Doanh thu theo tháng</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                  <Tooltip formatter={(v: any) => `${fmtMoney(Number(v))} đ`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center text-gray-400">Đang tải dữ liệu…</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
