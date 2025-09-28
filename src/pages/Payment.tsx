// src/pages/Payment.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Clock, CheckCircle, Download } from "lucide-react";
import axiosClient from "../axios/axiosClient";
import { useBooking } from "../contexts/BookingContext";
import { devForcePay } from "../service/TicketService";

// ==== Types (tối thiểu để chạy) ====
type BookingDataCtx = {
  customerName: string;
  phone: string;
  combo: string;            // tên loại vé (ticket type)
  quantity: number;
  totalPrice: number;
  bookingId?: number;
  paymentQrImage?: string;  // data:image/png;base64,...
  paymentQrString?: string; // "000201..."
  paymentQrUrl?: string;    // link ảnh hoặc link redirect
};

type Ticket = {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: string;
  issuedAt: string; // ISO string
};

// ==== Service nho nhỏ ====
async function apiGetTicketsByBooking(bookingId: number): Promise<Ticket[]> {
  // Backend: [Route("api/ticket")], GET api/ticket/by-booking/{bookingId}
  // QUAN TRỌNG: KHÔNG thêm "/" đầu đường dẫn nếu axiosClient.baseURL đã là ".../api"
  const res = await axiosClient.get<Ticket[]>(`ticket/by-booking/${bookingId}`);
  // Tương thích cả 2 kiểu axiosClient (unwrap .data hoặc không):
  return (res as any)?.data ?? (res as any);
}

// ==== Component chính ====
const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { bookingData } = useBooking() as { bookingData: BookingDataCtx | null };

  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success">("pending");
  const [countdown, setCountdown] = useState<number>(0);
  const [polling, setPolling] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // refs để clear interval đúng cách
  const timerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  // Tạo QR từ bookingData
  useEffect(() => {
    if (!bookingData) {
      navigate("/booking");
      return;
    }

    const loadQr = async () => {
      const { paymentQrImage, paymentQrString, paymentQrUrl } = bookingData;

      // 1) Có ảnh base64 từ backend -> dùng luôn
      if (paymentQrImage && paymentQrImage.startsWith("data:image")) {
        setQrCodeSrc(paymentQrImage);
        return;
      }

      // 2) Có chuỗi VietQR -> generate ảnh
      if (paymentQrString && paymentQrString.length > 10) {
        try {
          const dataUrl = await QRCode.toDataURL(paymentQrString);
          setQrCodeSrc(dataUrl);
          return;
        } catch (e) {
          console.error("Generate QR from paymentQrString failed:", e);
        }
      }

      // 3) Có URL -> nếu là ảnh thì hiển thị, nếu không thì generate từ URL
      if (paymentQrUrl) {
        const lower = paymentQrUrl.toLowerCase();
        const looksLikeImage =
          lower.startsWith("data:image") ||
          lower.endsWith(".png") ||
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".svg") ||
          lower.includes("base64");

        if (looksLikeImage) {
          setQrCodeSrc(paymentQrUrl);
          return;
        }

        try {
          const dataUrl = await QRCode.toDataURL(paymentQrUrl);
          setQrCodeSrc(dataUrl);
          return;
        } catch (e) {
          console.error("Generate QR from paymentQrUrl failed:", e);
        }
      }

      setQrCodeSrc("");
    };

    loadQr();
  }, [bookingData, navigate]);

  // cleanup intervals khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // Bắt đầu “kiểm tra thanh toán” = poll vé
  const handlePayment = () => {
    if (!bookingData?.bookingId) return;

    // reset trước
    setTickets([]);
    setPaymentStatus("processing");
    setCountdown(60);
    setPolling(true);

    // đếm ngược 60s
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          if (pollRef.current) window.clearInterval(pollRef.current);
          setPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // poll vé mỗi 2s
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const list = await apiGetTicketsByBooking(bookingData.bookingId!);
        setTickets(list);
        if (list.length > 0) {
          // đã có vé -> thành công + dừng mọi thứ
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

  // Màn hiển thị vé khi đã có tickets
  if (paymentStatus === "success" && tickets.length > 0 && bookingData) {
    return <TicketDisplay bookingData={bookingData} tickets={tickets} />;
  }

  if (!bookingData) return <div className="text-white p-6">Loading...</div>;

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

              <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  Chi tiết đơn hàng
                </h3>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p>Khách hàng: {bookingData.customerName}</p>
                  <p>Loại vé: {bookingData.combo}</p>
                  <p>Số lượng: {bookingData.quantity} vé</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">
                    Tổng tiền: {bookingData.totalPrice.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Quét mã QR để thanh toán qua Tingee
              </p>

              <button
                onClick={handlePayment}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
                disabled={!qrCodeSrc || polling || !bookingData.bookingId}
              >
                Tôi đã thanh toán
              </button>

              {/* Nút DEV: chỉ hiện ở development */}
              {import.meta.env.DEV && bookingData?.bookingId && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      try {
                        await devForcePay(bookingData.bookingId!);
                        // FE đang poll tickets -> tự thấy vé, không cần làm gì thêm
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-xs px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    (DEV) Ép thanh toán & phát hành vé
                  </button>
                </div>
              )}

              {/* Nếu backend trả link thanh toán, cho phép mở trực tiếp */}
              {bookingData.paymentQrUrl && !bookingData.paymentQrUrl.startsWith("data:image") && (
                <div className="mt-4">
                  <a
                    href={bookingData.paymentQrUrl}
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

// === Hiển thị vé + nút lưu ảnh ===
const TicketDisplay: React.FC<{ bookingData: BookingDataCtx; tickets: Ticket[] }> = ({
  bookingData,
  tickets,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const firstTicket = useMemo(() => tickets[0], [tickets]);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    // scale up cho nét
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

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md mx-auto">
        <div
          ref={cardRef}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30"
        >
          {/* Decorative bg */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Content */}
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MUSIC NIGHT
              </h1>
              <p className="text-gray-300 text-sm">Concert Ticket</p>
            </div>

            {/* Info blocks */}
            <div className="space-y-4 mb-6">
              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Tên khách hàng</p>
                <p className="text-white font-semibold text-base sm:text-lg">
                  {bookingData.customerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-gray-400 text-sm">Loại vé</p>
                  <p className="text-yellow-400 font-semibold text-sm sm:text-base">
                    {bookingData.combo}
                  </p>
                </div>
                <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-gray-400 text-sm">Số lượng</p>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    {bookingData.quantity} vé
                  </p>
                </div>
              </div>

              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Mã vé</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {firstTicket?.ticketCode}
                </p>
              </div>

              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Tổng tiền</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {bookingData.totalPrice.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <div className="w-full h-8 bg-gradient-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 rounded-full mb-4 flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-xs">
                Vui lòng xuất trình vé này tại cửa vào
              </p>
              <p className="text-yellow-400 text-xs font-semibold">
                #{(bookingData.bookingId ?? Date.now()).toString().slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
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

        {/* Danh sách tất cả mã vé (nếu đặt >1) */}
        {tickets.length > 1 && (
          <div className="mt-6 text-gray-300 text-sm">
            <div className="font-semibold mb-2">Tất cả mã vé:</div>
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-2 rounded bg-black/30 border border-gray-700 text-white"
                  >
                    {t.ticketCode}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
