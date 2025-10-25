// src/pages/Payment.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Clock, CheckCircle, Download, XCircle } from "lucide-react";
import axiosClient from "../axios/axiosClient";
import { useBooking } from "../contexts/BookingContext";
import { devForcePay } from "../service/TicketService";

/* ====== Types ====== */
type BookingData = {
  customerName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  bookingId?: number;
  paymentQrImage?: string;
  paymentQrString?: string;
  paymentQrUrl?: string;
  bookingCode?: string;
  // màu combo nếu có lưu từ admin
  comboColor?: string;
  ticketTypeColor?: string;
};

type Ticket = {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: string;
  issuedAt: string;
  // các field màu có thể được backend trả về
  color?: string;
  ticketTypeColor?: string;
  // thêm 2 field tùy API của bạn
  holderName?: string;      // tên người cầm vé (nếu có)
  customerName?: string;    // tên người đặt từ backend (nếu trả)
};

/* ====== API nhỏ ====== */
async function apiGetTicketsByBooking(bookingId: number): Promise<Ticket[]> {
  const res = await axiosClient.get<Ticket[]>(`ticket/by-booking/${bookingId}`);
  // @ts-ignore
  return Array.isArray(res) ? res : res.data;
}

/* ====== Helper: lấy màu từ dữ liệu ====== */
function resolveTicketColor(
  tickets: Ticket[],
  bookingData?: BookingData | null
): string {
  const first = tickets?.[0];
  const fromApi =
    first?.ticketTypeColor ||
    first?.color ||
    bookingData?.ticketTypeColor ||
    bookingData?.comboColor;

  if (fromApi) return fromApi;

  // fallback theo tên combo
  const name = (bookingData?.combo || "").toLowerCase();
  if (name.includes("vip")) return "#f59e0b"; // amber-500
  if (name.includes("standard") || name.includes("thường")) return "#3b82f6"; // blue-500
  if (name.includes("premium") || name.includes("gold")) return "#ef4444"; // red-500/gold-ish
  if (name.includes("student") || name.includes("sv")) return "#10b981"; // emerald-500
  return "#f59e0b"; // mặc định amber-500
}

/* ====== Component ====== */
const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { bookingData?: BookingData; bookingMeta?: BookingData } };

  const { bookingData, setBookingData } = useBooking() as {
    bookingData: BookingData | null;
    setBookingData: (v: BookingData) => void;
  };

  const stateData =
    location?.state?.bookingData ??
    location?.state?.bookingMeta ??
    null;

  const sessionParsed: BookingData | null = (() => {
    try {
      const raw = sessionStorage.getItem("bookingData");
      return raw ? (JSON.parse(raw) as BookingData) : null;
    } catch {
      return null;
    }
  })();

  const mergedData: BookingData | null = bookingData ?? stateData ?? sessionParsed;

  useEffect(() => {
    if (!bookingData && mergedData) {
      setBookingData(mergedData);
      try { sessionStorage.setItem("bookingData", JSON.stringify(mergedData)); } catch {}
    }
  }, [bookingData, mergedData, setBookingData]);

  useEffect(() => {
    if (!mergedData) navigate("/booking", { replace: true });
  }, [mergedData, navigate]);

  // ------- State hiển thị -------
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [paymentStatus, setPaymentStatus] =
    useState<"pending" | "processing" | "success" | "failed">("pending");
  const [countdown, setCountdown] = useState<number>(0);
  const [polling, setPolling] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketColor, setTicketColor] = useState<string>("#f59e0b");

  const timerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const ticketsRef = useRef<Ticket[]>([]);
  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);

  // tạo QR từ mergedData
  useEffect(() => {
    if (!mergedData) return;

    (async () => {
      const { paymentQrImage, paymentQrString, paymentQrUrl } = mergedData;

      if (paymentQrImage?.startsWith("data:image")) {
        setQrCodeSrc(paymentQrImage);
        return;
      }

      if (paymentQrString && paymentQrString.length > 10) {
        try {
          setQrCodeSrc(await QRCode.toDataURL(paymentQrString));
          return;
        } catch {}
      }

      if (paymentQrUrl) {
        const lower = paymentQrUrl.toLowerCase();
        const looksLikeImage =
          lower.startsWith("data:image") ||
          lower.endsWith(".png") || lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") || lower.endsWith(".svg") ||
          lower.includes("base64");

        if (looksLikeImage) { setQrCodeSrc(paymentQrUrl); return; }

        try {
          setQrCodeSrc(await QRCode.toDataURL(paymentQrUrl));
          return;
        } catch {}
      }

      setQrCodeSrc("");
    })();
  }, [mergedData]);

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // user bấm "Tôi đã thanh toán"
  const handlePayment = () => {
    if (!mergedData?.bookingId) return;

    setTickets([]);
    setPaymentStatus("processing");
    setCountdown(15);
    setPolling(true);

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // hết giờ
          if (timerRef.current) window.clearInterval(timerRef.current);
          if (pollRef.current) window.clearInterval(pollRef.current);
          setPolling(false);
          // nếu vẫn chưa có vé -> failed
          if (!ticketsRef.current || ticketsRef.current.length === 0) {
            setPaymentStatus("failed");
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const list = await apiGetTicketsByBooking(mergedData.bookingId!);
        setTickets(list);
        if (list.length > 0) {
          // xác định màu ngay khi có vé
          setTicketColor(resolveTicketColor(list, mergedData));
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (timerRef.current) window.clearInterval(timerRef.current);
          setPolling(false);
          setPaymentStatus("success");
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };

  // reset để "Quay lại trang thanh toán"
  const handleBackToPayment = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (pollRef.current) window.clearInterval(pollRef.current);
    setTickets([]);
    setCountdown(0);
    setPolling(false);
    setPaymentStatus("pending");
  };

  // --- Nếu chưa có dữ liệu, hiển thị loading ngắn ---
  if (!mergedData) return <div className="text-white p-6">Đang tải thông tin thanh toán…</div>;

  // --- Khi đã có vé ---
  if (paymentStatus === "success" && tickets.length > 0) {
    return <TicketDisplay bookingData={mergedData} tickets={tickets} ticketColor={ticketColor} />;
  }

  // --- Màn payment / processing / failed ---
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">
            Thanh toán
          </h1>

          {paymentStatus === "pending" && (
            <div className="text-center">
              <div className="mb-6">
                {qrCodeSrc ? (
                  <img
                    src={qrCodeSrc}
                    alt="QR Code Payment"
                    className="mx-auto w-48 h-48 sm:w-64 sm:h-64 border-4 border-white rounded-lg"
                  />
                ) : (
                  <div className="text-gray-300">Không có mã QR để hiển thị.</div>
                )}
              </div>
              <p className="text-red-400 mb-6 text-sm sm:text-base">
                Quét mã QR để thanh toán, vui lòng nhập chính xác nội dung: BOOKING{mergedData.bookingId}
              </p>
              <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  Chi tiết đơn hàng
                </h3>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p>Khách hàng: {mergedData.customerName}</p>
                  <p>Loại vé: {mergedData.combo}</p>
                  <p>Số lượng: {mergedData.quantity} vé</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">
                    Tổng tiền: {mergedData.totalPrice.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
                disabled={!qrCodeSrc || polling || !mergedData.bookingId}
              >
                Tôi đã thanh toán
              </button>

              {import.meta.env.DEV && mergedData?.bookingId && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      try { await devForcePay(mergedData.bookingId!); } catch (e) { console.error(e); }
                    }}
                    className="text-xs px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    (DEV) Ép thanh toán & phát hành vé
                  </button>
                </div>
              )}

              {mergedData.paymentQrUrl && !mergedData.paymentQrUrl.startsWith("data:image") && (
                <div className="mt-4">
                  <a
                    href={mergedData.paymentQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 underline text-sm"
                  >
                    Mở trang thanh toán Tingee
                  </a>
                </div>
              )}
            </div>
          )}

          {paymentStatus === "processing" && (
            <div className="text-center">
              <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Đang kiểm tra thanh toán
              </h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Vui lòng chờ trong giây lát...
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{countdown}s</div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center">
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Thanh toán không thành công
              </h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Hệ thống chưa nhận được giao dịch. Vui lòng kiểm tra <span className="text-red-400 font-semibold">đúng nội dung chuyển khoản</span>:
                <br />
                <span className="text-yellow-300 font-mono">BOOKING{mergedData.bookingId}</span>
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleBackToPayment}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Quay lại trang thanh toán
                </button>
                {mergedData.paymentQrUrl && !mergedData.paymentQrUrl.startsWith("data:image") && (
                  <a
                    href={mergedData.paymentQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 px-5 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Mở lại trang Tingee
                  </a>
                )}
              </div>
            </div>
          )}

          {paymentStatus === "success" && tickets.length === 0 && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Thanh toán thành công!
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">Đang tải vé của bạn...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ====== Hiển thị vé + lưu ảnh ====== */
const TicketDisplay: React.FC<{ bookingData: BookingData; tickets: Ticket[]; ticketColor: string }> = ({
  bookingData,
  tickets,
  ticketColor,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const firstTicket = useMemo(() => tickets[0], [tickets]);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      useCORS: true,
      scale: window.devicePixelRatio || 2,
      backgroundColor: null,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ticket-${firstTicket?.ticketCode || "unknown"}.png`;
    a.click();
  };

  // dựng gradient từ màu chính
  const bgGradient = `linear-gradient(135deg, ${ticketColor}33, ${ticketColor}55)`;
  const borderColor = ticketColor;
  const groupedByName = useMemo(() => {
  const map = new Map<string, Ticket[]>();
  tickets.forEach((t) => {
    const name =
      t.holderName?.trim() ||
      t.customerName?.trim() ||
      bookingData.customerName?.trim() ||
      "Khách hàng";
    const arr = map.get(name) || [];
    arr.push(t);
    map.set(name, arr);
  });
  return Array.from(map.entries()); // [ [name, Ticket[]], ... ]
}, [tickets, bookingData.customerName]);
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md mx-auto">
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
              backgroundImage:
                "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800')",
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
                {bookingData.combo?.toUpperCase() || "MUSIC NIGHT"}
              </h1>
              <p className="text-gray-200 text-sm">Concert Ticket</p>
            </div>

            <div className="space-y-4 mb-6">
              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{ background: "#00000040", border: `1px solid ${borderColor}33` }}
              >
                <p className="text-gray-200 text-sm">Tên khách hàng</p>
                <p className="text-white font-semibold text-base sm:text-lg">
                  {bookingData.customerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-3 sm:p-4 rounded-lg"
                  style={{ background: "#00000040", border: `1px solid ${borderColor}33` }}
                >
                  <p className="text-gray-200 text-sm">Loại vé</p>
                  <p className="font-semibold text-sm sm:text-base" style={{ color: borderColor }}>
                    {bookingData.combo}
                  </p>
                </div>
                <div
                  className="p-3 sm:p-4 rounded-lg"
                  style={{ background: "#00000040", border: `1px solid ${borderColor}33` }}
                >
                  <p className="text-gray-200 text-sm">Số lượng</p>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    {bookingData.quantity} vé
                  </p>
                </div>
              </div>

              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{ background: "#00000040", border: `1px solid ${borderColor}33` }}
              >
                <p className="text-gray-200 text-sm">Mã vé</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {firstTicket?.ticketCode}
                </p>
              </div>

              <div
                className="p-3 sm:p-4 rounded-lg"
                style={{ background: "#00000040", border: `1px solid ${borderColor}33` }}
              >
                <p className="text-gray-200 text-sm">Tổng tiền</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {bookingData.totalPrice.toLocaleString("vi-VN")}đ
                </p>
              </div>
              {tickets.length > 0 && (
              <div className="mt-6 text-gray-300 text-sm space-y-4">
                {groupedByName.map(([name, list]) => (
                  <div key={name}>
                    <div className="font-semibold mb-2">
                      Vé của <span className="text-white">{name}</span>
                    </div>
                    <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {list.map((t) => (
                          <div
                            key={t.id}
                            className="px-3 py-2 rounded bg-black/30 border border-gray-700 text-white flex items-center justify-between"
                          >
                            <span className="font-mono">{t.ticketCode}</span>
                            {/* nếu muốn gắn màu loại vé ở từng mã: */}
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ background: t.ticketTypeColor || t.color || "#999" }}
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
              <div className="w-full h-8 rounded-full mb-4 flex items-center justify-center"
                   style={{ background: `${ticketColor}33` }}>
                <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: ticketColor }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text:black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
          >
            Về trang chủ
          </button>

          <button
            onClick={handleSaveImage}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-5 rounded-lg transition-colors text-sm sm:text-base"
            title="Lưu vé thành ảnh"
          >
            <Download className="w-4 h-4" /> Lưu vé
          </button>
        </div>

        {/* {tickets.length > 1 && (
          <div className="mt-6 text-gray-300 text-sm">
            <div className="font-semibold mb-2">Tất cả mã vé:</div>
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tickets.map((t) => (
                  <div key={t.id} className="px-3 py-2 rounded bg-black/30 border border-gray-700 text-white">
                    {t.ticketCode}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Payment;
