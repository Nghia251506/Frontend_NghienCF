// src/pages/Payment.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Clock, CheckCircle, Download } from "lucide-react";
import axiosClient from "../axios/axiosClient";
import { useBooking } from "../contexts/BookingContext";
import { devForcePay } from "../service/TicketService";

type BookingDataCtx = {
  customerName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  bookingId?: number;
  paymentQrImage?: string;
  paymentQrString?: string;
  paymentQrUrl?: string;
};

type Ticket = {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: string;
  issuedAt: string;
};

async function apiGetTicketsByBooking(bookingId: number): Promise<Ticket[]> {
  const  data  = await axiosClient.get<Ticket[]>(`ticket/by-booking/${bookingId}`);
  return data;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { bookingData?: BookingDataCtx } };
  const { bookingData, setBookingData } = useBooking() as {
    bookingData: BookingDataCtx | null;
    setBookingData: (v: BookingDataCtx) => void;
  };

  const [hydrated, setHydrated] = useState(false);
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [paymentStatus, setPaymentStatus] =
    useState<"pending" | "processing" | "success">("pending");
  const [countdown, setCountdown] = useState<number>(0);
  const [polling, setPolling] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const timerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  // 1) Hydrate bookingData: context -> location.state -> sessionStorage
  useEffect(() => {
    if (bookingData) {
      setHydrated(true);
      return;
    }
    const fromState = location?.state?.bookingData;
    if (fromState) {
      setBookingData(fromState);
      sessionStorage.setItem("bookingData", JSON.stringify(fromState));
      setHydrated(true);
      return;
    }
    const raw = sessionStorage.getItem("bookingData");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as BookingDataCtx;
        setBookingData(parsed);
      } catch {}
    }
    setHydrated(true);
  }, [bookingData, location?.state, setBookingData]);

  // 2) Nếu đã hydrate mà vẫn không có data -> quay lại trang đặt vé
  useEffect(() => {
    if (hydrated && !bookingData) navigate("/booking", { replace: true });
  }, [hydrated, bookingData, navigate]);

  // 3) Render QR
  useEffect(() => {
    if (!bookingData) return;

    const loadQr = async () => {
      const { paymentQrImage, paymentQrString, paymentQrUrl } = bookingData;

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
          setQrCodeSrc(await QRCode.toDataURL(paymentQrUrl));
          return;
        } catch {}
      }
      setQrCodeSrc("");
    };

    loadQr();
  }, [bookingData]);

  // 4) cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const handlePayment = () => {
    if (!bookingData?.bookingId) return;

    setTickets([]);
    setPaymentStatus("processing");
    setCountdown(60);
    setPolling(true);

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

    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const list = await apiGetTicketsByBooking(bookingData.bookingId!);
        setTickets(list);
        if (list.length > 0) {
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

  if (!hydrated || !bookingData) {
    return <div className="text-white p-6">Đang tải thông tin thanh toán…</div>;
  }

  if (paymentStatus === "success" && tickets.length > 0) {
    return <TicketDisplay bookingData={bookingData} tickets={tickets} />;
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div
          className="backdrop-blur-lg p-6 sm:p-8 rounded-xl"
          style={{
            backgroundColor: "color-mix(in srgb, rgb(var(--color-surface)) 70%, #000 30%)",
            border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 25%, transparent)",
          }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center"
            style={{ color: "rgb(var(--color-text))" }}
          >
            Thanh toán
          </h1>

          {paymentStatus === "pending" && (
            <div className="text-center">
              <div className="mb-6">
                {qrCodeSrc ? (
                  <img
                    src={qrCodeSrc}
                    alt="QR Code Payment"
                    className="mx-auto w-48 h-48 sm:w-64 sm:h-64 rounded-lg"
                    style={{ border: "4px solid rgb(var(--color-text))" }}
                  />
                ) : (
                  <div style={{ color: "rgb(var(--color-text))", opacity: 0.8 }}>
                    Không có mã QR để hiển thị.
                  </div>
                )}
              </div>

              <div
                className="p-4 sm:p-6 rounded-lg mb-6"
                style={{
                  backgroundColor: "color-mix(in srgb, rgb(var(--color-bg)) 60%, #000 40%)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <h3
                  className="text-base sm:text-lg font-semibold mb-2"
                  style={{ color: "rgb(var(--color-text))" }}
                >
                  Chi tiết đơn hàng
                </h3>
                <div
                  className="space-y-1 text-sm sm:text-base"
                  style={{ color: "rgb(var(--color-text))", opacity: 0.85 }}
                >
                  <p>Khách hàng: {bookingData.customerName}</p>
                  <p>Loại vé: {bookingData.combo}</p>
                  <p>Số lượng: {bookingData.quantity} vé</p>
                  <p
                    className="text-lg sm:text-xl font-bold"
                    style={{ color: "rgb(var(--color-primary))" }}
                  >
                    Tổng tiền: {bookingData.totalPrice.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              <p className="mb-6 text-sm sm:text-base" style={{ color: "rgb(var(--color-muted))" }}>
                Quét mã QR để thanh toán qua Tingee
              </p>

              <button
                onClick={handlePayment}
                className="font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
                style={{
                  color: "#000",
                  backgroundImage:
                    "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                }}
                disabled={!qrCodeSrc || polling || !bookingData.bookingId}
              >
                Tôi đã thanh toán
              </button>

              {import.meta.env.DEV && bookingData?.bookingId && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      try {
                        await devForcePay(bookingData.bookingId!);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-xs px-3 py-2 rounded text-white"
                    style={{ backgroundColor: "rgb(var(--color-primary))" }}
                  >
                    (DEV) Ép thanh toán & phát hành vé
                  </button>
                </div>
              )}

              {bookingData.paymentQrUrl && !bookingData.paymentQrUrl.startsWith("data:image") && (
                <div className="mt-4">
                  <a
                    href={bookingData.paymentQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-sm"
                    style={{ color: "rgb(var(--color-primary))" }}
                  >
                    Mở trang thanh toán Tingee
                  </a>
                </div>
              )}
            </div>
          )}

          {paymentStatus === "processing" && (
            <div className="text-center">
              <Clock
                className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 animate-spin"
                style={{ color: "rgb(var(--color-primary))" }}
              />
              <h3
                className="text-xl sm:text-2xl font-bold mb-4"
                style={{ color: "rgb(var(--color-text))" }}
              >
                Đang kiểm tra thanh toán
              </h3>
              <p
                className="mb-4 text-sm sm:text-base"
                style={{ color: "rgb(var(--color-text))", opacity: 0.8 }}
              >
                Vui lòng chờ trong giây lát...
              </p>
              <div
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: "rgb(var(--color-primary))" }}
              >
                {countdown}s
              </div>
            </div>
          )}

          {paymentStatus === "success" && tickets.length === 0 && (
            <div className="text-center">
              <CheckCircle
                className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4"
                style={{ color: "rgb(var(--color-primary))" }}
              />
              <h3
                className="text-xl sm:text-2xl font-bold mb-4"
                style={{ color: "rgb(var(--color-text))" }}
              >
                Thanh toán thành công!
              </h3>
              <p className="text-sm sm:text-base" style={{ color: "rgb(var(--color-muted))" }}>
                Đang tải vé của bạn...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketDisplay: React.FC<{ bookingData: BookingDataCtx; tickets: Ticket[] }> = ({
  bookingData,
  tickets,
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

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md mx-auto">
        {/* ...giữ nguyên phần render vé của bạn... */}
        <div ref={cardRef} />
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => (window.location.href = "/")}
            className="font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
            style={{
              color: "#000",
              backgroundImage:
                "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
            }}
          >
            Về trang chủ
          </button>
          <button
            onClick={handleSaveImage}
            className="flex items-center gap-2 font-semibold py-2 sm:py-3 px-4 sm:px-5 rounded-lg transition-colors text-sm sm:text-base"
            style={{ backgroundColor: "rgb(var(--color-surface))", color: "rgb(var(--color-text))" }}
            title="Lưu vé thành ảnh"
          >
            <Download className="w-4 h-4" /> Lưu vé
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
