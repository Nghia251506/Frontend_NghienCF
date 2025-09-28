import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useBooking } from '../contexts/BookingContext';
import { Clock, CheckCircle } from 'lucide-react';

type BookingDataCtx = {
  customerName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  seatNumbers?: string[];
  bookingId?: number;
  paymentQrImage?: string;   // <-- từ backend (ưu tiên)
  paymentQrString?: string;  // <-- từ backend (000201...)
  paymentQrUrl?: string;     // <-- từ backend (link)
};

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { bookingData } = useBooking() as { bookingData: BookingDataCtx | null };
  const [qrCodeSrc, setQrCodeSrc] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [countdown, setCountdown] = useState<number>(0);
  const [showTicket, setShowTicket] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
      return;
    }

    const loadQr = async () => {
      const { paymentQrImage, paymentQrString, paymentQrUrl } = bookingData;

      // 1) Nếu backend trả sẵn ảnh (base64 data URL) -> dùng luôn
      if (paymentQrImage && paymentQrImage.startsWith('data:image')) {
        setQrCodeSrc(paymentQrImage);
        return;
      }

      // 2) Nếu có chuỗi QR “000201...” -> generate ảnh từ chuỗi
      if (paymentQrString && paymentQrString.length > 10) {
        try {
          const dataUrl = await QRCode.toDataURL(paymentQrString);
          setQrCodeSrc(dataUrl);
          return;
        } catch (e) {
          console.error('Generate QR from paymentQrString failed:', e);
        }
      }

      // 3) Nếu có URL (đôi khi Tingee trả link) -> 
      //    - nếu là URL ảnh, hiển thị trực tiếp
      //    - nếu không phải ảnh, generate QR từ chính URL đó (để user scan mở link)
      if (paymentQrUrl) {
        const lower = paymentQrUrl.toLowerCase();
        const looksLikeImage =
          lower.startsWith('data:image') ||
          lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') ||
          lower.includes('base64'); // phòng TH ảnh base64

        if (looksLikeImage) {
          setQrCodeSrc(paymentQrUrl);
          return;
        }

        try {
          const dataUrl = await QRCode.toDataURL(paymentQrUrl);
          setQrCodeSrc(dataUrl);
          return;
        } catch (e) {
          console.error('Generate QR from paymentQrUrl failed:', e);
        }
      }

      // 4) Fallback (không có gì để hiển thị)
      setQrCodeSrc('');
    };

    loadQr();
  }, [bookingData, navigate]);

  const handlePayment = () => {
    // Demo flow: bấm nút "Tôi đã thanh toán" -> mô phỏng đếm ngược
    setPaymentStatus('processing');
    setCountdown(15);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('success');
          setTimeout(() => setShowTicket(true), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!bookingData) return <div>Loading...</div>;
  if (showTicket) return <TicketDisplay bookingData={bookingData} />;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">Thanh toán</h1>

          {paymentStatus === 'pending' && (
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
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Chi tiết đơn hàng</h3>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p>Khách hàng: {bookingData.customerName}</p>
                  <p>Gói vé: {bookingData.combo}</p>
                  <p>Số lượng: {bookingData.quantity} vé</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">
                    Tổng tiền: {bookingData.totalPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Quét mã QR để thanh toán qua Tingee
              </p>

              <button
                onClick={handlePayment}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
                disabled={!qrCodeSrc}
              >
                Tôi đã thanh toán
              </button>

              {/* Nếu backend có link thanh toán (không phải ảnh), show nút mở trang */}
              {bookingData.paymentQrUrl && !bookingData.paymentQrUrl.startsWith('data:image') && (
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

          {paymentStatus === 'processing' && (
            <div className="text-center">
              <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Đang xử lý thanh toán</h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">Vui lòng chờ trong giây lát...</p>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{countdown}s</div>
            </div>
          )}

          {paymentStatus === 'success' && !showTicket && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Thanh toán thành công!</h3>
              <p className="text-gray-300 text-sm sm:text-base">Đang tạo vé của bạn...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketDisplay: React.FC<{ bookingData: BookingDataCtx }> = ({ bookingData }) => {
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MUSIC NIGHT
              </h1>
              <p className="text-gray-300 text-sm">Concert Ticket</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Tên khách hàng</p>
                <p className="text-white font-semibold text-base sm:text-lg">{bookingData.customerName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-gray-400 text-sm">Gói vé</p>
                  <p className="text-yellow-400 font-semibold text-sm sm:text-base">{bookingData.combo}</p>
                </div>
                <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-gray-400 text-sm">Số lượng</p>
                  <p className="text-white font-semibold text-sm sm:text-base">{bookingData.quantity} vé</p>
                </div>
              </div>

              {bookingData.seatNumbers?.length ? (
                <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-gray-400 text-sm">Số ghế</p>
                  <p className="text-white font-semibold text-sm sm:text-base break-all">
                    {bookingData.seatNumbers.join(', ')}
                  </p>
                </div>
              ) : null}

              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Tổng tiền</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {bookingData.totalPrice.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-full h-8 bg-gradient-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 rounded-full mb-4 flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-xs">Vui lòng xuất trình vé này tại cửa vào</p>
              <p className="text-yellow-400 text-xs font-semibold">#{(bookingData.bookingId ?? Date.now()).toString().slice(-8)}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
