import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import axiosClient from "../axios/axiosClient";

/* ====== Types ====== */
type Ticket = {
  id: number;
  ticketCode: string;
  color?: string;
  ticketTypeColor?: string;
  holderName?: string;
  customerName?: string;
  image_url?: string;
};

type BookingDetail = {
  id: number;
  customerName: string;
  quantity: number;
  showId: number;
  ticketType?: {
    name: string;
    color: string;
  };
};

type ShowDetail = {
  id: number;
  title: string;
  date: string;
  location: string;
};

// 🔥 HÀM CỨU GIÁ: Trả lại màu đẹp nếu DB cài màu lỗi/đen/trắng
const resolveColor = (apiColor?: string, comboName?: string) => {
  // Nếu API trả về HEX chuẩn và KHÔNG PHẢI trắng/đen tuyền
  if (
    apiColor &&
    apiColor.startsWith("#") &&
    apiColor !== "#ffffff" &&
    apiColor !== "#000000" &&
    apiColor !== "#fff" &&
    apiColor !== "#000"
  ) {
    return apiColor;
  }
  // Fallback theo tên y hệt logic cũ
  const name = (comboName || "").toLowerCase();
  if (name.includes("vip") || name.includes("s")) return "#f59e0b"; // Vàng Cam (Đẹp cho Combo S)
  if (name.includes("standard") || name.includes("thường")) return "#3b82f6"; // Xanh dương
  if (name.includes("premium") || name.includes("gold")) return "#ef4444"; // Đỏ
  if (name.includes("student") || name.includes("sv")) return "#10b981"; // Xanh lá
  return "#f59e0b"; // Default Vàng Cam
};

const TicketView: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  // State quản lý data
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch Logic
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;
      setLoading(true);
      try {
        const resBooking = (await axiosClient.get<BookingDetail>(
          `booking/${bookingId}`,
        )) as any;
        setBooking(resBooking);

        if (resBooking?.showId) {
          const resShow = (await axiosClient.get<ShowDetail>(
            `show/${resBooking.showId}`,
          )) as any;
          setShow(resShow);
        }

        const resTickets = (await axiosClient.get<Ticket[]>(
          `ticket/by-booking/${bookingId}`,
        )) as any;
        setTickets(resTickets);
      } catch (err) {
        console.error("Lỗi fetch dữ liệu vé:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // --- Helpers ---
  const firstTicket = useMemo(() => tickets[0], [tickets]);

  const isMobile = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // 🔥 SỬ DỤNG HÀM RESOLVE COLOR Ở ĐÂY
  const ticketColor = useMemo(() => {
    const rawApiColor =
      booking?.ticketType?.color ||
      firstTicket?.ticketTypeColor ||
      firstTicket?.color;
    return resolveColor(rawApiColor, booking?.ticketType?.name);
  }, [booking, firstTicket]);

  const displayTime = useMemo(() => {
    if (!show?.date) return "Đang cập nhật";
    return new Date(show.date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [show]);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      useCORS: true,
      scale: window.devicePixelRatio || 2,
      backgroundColor: null,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const filename = `ticket-${firstTicket?.ticketCode || "unknown"}.png`;

    if (isMobile()) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<title>${filename}</title><img src="${dataUrl}" style="width:100%;height:auto;" />`,
        );
      } else {
        window.location.href = dataUrl;
      }
      return;
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const bgGradient = `linear-gradient(135deg, ${ticketColor}33, ${ticketColor}55)`;
  const background_image = firstTicket?.image_url;
  const borderColor = ticketColor;

  const groupedByName = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    tickets.forEach((t) => {
      const name =
        t.holderName?.trim() ||
        t.customerName?.trim() ||
        booking?.customerName?.trim() ||
        "Khách hàng";
      const arr = map.get(name) || [];
      arr.push(t);
      map.set(name, arr);
    });
    return Array.from(map.entries());
  }, [tickets, booking]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* Vòng xoay Spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        {/* Chữ chớp tắt */}
        <p className="!text-white font-bold tracking-widest uppercase animate-pulse">
          Đang tải vé của bạn...
        </p>
      </div>
    );
  }
  if (!booking || !tickets.length)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Không tìm thấy thông tin đơn hàng hoặc vé chưa được phát hành.
      </div>
    );

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-100 mx-auto lg:flex gap-6 flex-wrap justify-center">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: bgGradient,
            border: `1px solid ${borderColor}55`,
          }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: background_image
                ? `url(${background_image})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: borderColor }}
              >
                {booking.ticketType?.name?.toUpperCase() || "MUSIC NIGHT"}
              </h1>
              <p className="text-gray-200 text-sm">Chạm Ticket</p>
            </div>

            <div className="space-y-4 mb-6">
              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{
                  background: "#00000040",
                  border: `1px solid ${borderColor}33`,
                }}
              >
                <p className="text-gray-200 text-sm">Tên khách hàng</p>
                <p className="!text-white font-semibold text-base sm:text-lg">
                  {booking.customerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-3 sm:p-4 rounded-lg"
                  style={{
                    background: "#00000040",
                    border: `1px solid ${borderColor}33`,
                  }}
                >
                  <p className="!text-white text-sm">Loại combo</p>
                  <p
                    className="font-semibold text-sm sm:text-base"
                    style={{ color: borderColor }}
                  >
                    {booking.ticketType?.name || "Combo"}
                  </p>
                </div>
                <div
                  className="p-3 sm:p-4 rounded-lg"
                  style={{
                    background: "#00000040",
                    border: `1px solid ${borderColor}33`,
                  }}
                >
                  <p className="text-gray-200 text-sm">Số lượng</p>
                  <p className="!text-white font-semibold text-sm sm:text-base">
                    {booking.quantity} ghế
                  </p>
                </div>
              </div>

              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{
                  background: "#00000040",
                  border: `1px solid ${borderColor}33`,
                }}
              >
                <p className="text-gray-200 text-sm">Thời gian</p>
                <p className="!text-white font-semibold text-sm sm:text-base">
                  {displayTime}
                </p>
              </div>

              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{
                  background: "#00000040",
                  border: `1px solid ${borderColor}33`,
                }}
              >
                <p className="text-gray-200 text-sm">Địa điểm</p>
                <p className="!text-white font-semibold text-sm sm:text-base">
                  {show?.location || "Đang cập nhật"}
                </p>
              </div>

              {tickets.length > 0 && (
                <div className="mt-6 text-gray-300 text-sm space-y-4">
                  {groupedByName.map(([name, list]) => (
                    <div key={name}>
                      <div className="font-semibold mb-2 !text-white">
                        Ghế của <span className="!text-white">{name}</span>
                      </div>
                      <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {list.map((t) => (
                            <div
                              key={t.id}
                              className="px-3 py-2 rounded bg-black/30 border border-gray-700 !text-white flex items-center justify-between"
                            >
                              <span className="font-mono">{t.ticketCode}</span>
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ background: ticketColor }} // 🔥 Fix luôn cái chấm màu cho nó rực rỡ
                                title="Màu loại vé"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <div
                className="w-full h-8 rounded-full mb-4 flex items-center justify-center"
                style={{ background: `${ticketColor}33` }}
              >
                <div
                  className="w-4 h-4 rounded-full animate-pulse"
                  style={{ background: ticketColor }}
                />
              </div>
            </div>

            <div
              className="flex items-center justify-center gap-3 mt-8"
              data-html2canvas-ignore="true"
            >
              <button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                Về trang chủ
              </button>

              <button
                onClick={handleSaveImage}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-5 rounded-lg transition-colors text-sm sm:text-base"
                title="Lưu thành ảnh"
              >
                <Download className="w-4 h-4" /> Tải về
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 w-full bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-yellow-500/20">
          <h2 className="text-xl sm:text-2xl font-bold !text-white mt-8 mb-4">
            Thông tin tham dự Chạm
          </h2>
          <ul className="text-sm text-gray-300 space-y-3">
            <li>🎼 THÔNG TIN THAM DỰ CHẠM</li>
            <li>⸻</li>
            <li>
              1. Thời gian & Check-in: • Chương trình diễn ra: 20h00 – 22h30 •
              Check-in: 19h20 – 20h00. Sau 20h30, nếu Anh/Chị chưa đến, Chạm
              xin phép huỷ bàn và không hoàn tiền.
            </li>
            <li>⸻</li>
            <li>
              2. Các bước check-in tại cửa: 1. Cung cấp Tên người đặt bàn + Mã
              bàn + 3 số cuối SĐT 2. Order đồ uống/bánh/bỏng theo combo đã đặt
              3. Vào ổn định vị trí bàn đã đặt
            </li>
            <li>
              Lưu ý: • Không trả thẻ bàn khi chưa nhận đủ đồ. • Nếu thiếu đồ
              hoặc cần order thêm, vui lòng liên hệ nhân viên hoặc page để được
              hỗ trợ.
            </li>
            <li>⸻</li>
            <li>
              3. Về chỗ ngồi: * Các vị trí ngồi tự do nên mọi người vui lòng
              chủ động đến sớm để hoàn thiện công tác check-in và chọn vị trí
              ngồi ưng ý * Các bàn nhóm đông người mọi xin vui lòng chủ động đến
              sớm giữ vị trí, nếu đến sau hết vị trí ghế liền kề xin vui lòng
              ngồi riêng lẻ theo số ghế còn lại
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
