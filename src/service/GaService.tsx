import axiosClient from "../axios/axiosClient";

export type GaDaily = {
  date: string;          // "yyyyMMdd" (vd: "20251113")
  activeUsers: number;   // BE đang trả "users" -> FE map thành activeUsers
  pageViews: number;
};

export async function getGaDaily(params: { start: string; end: string }) {
  // start/end có thể là "7daysAgo" / "today" hoặc "2025-11-01" / "2025-11-13"
  const res = await axiosClient.get<GaDaily[]>("/admin/ga/daily", { params });
  // Chuẩn hoá key nếu BE vẫn trả "users"
  return res.map(x => ({
    date: x.date,
    activeUsers: (x as any).activeUsers ?? (x as any).users ?? 0,
    pageViews: x.pageViews,
  }));
}