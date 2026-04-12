import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingData, setBookingData } = useBooking() as any;
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [isTransferred, setIsTransferred] = useState(false);

  const mergedData = bookingData ?? location.state?.bookingData ?? JSON.parse(sessionStorage.getItem("bookingData") || "null");

  useEffect(() => {
    if (!mergedData) { navigate("/booking", { replace: true }); return; }
    if (!bookingData) setBookingData(mergedData);

    (async () => {
      const { paymentQrImage, paymentQrString, paymentQrUrl } = mergedData;
      if (paymentQrImage?.startsWith("data:image")) return setQrCodeSrc(paymentQrImage);
      const str = paymentQrString || paymentQrUrl;
      if (str) try { setQrCodeSrc(await QRCode.toDataURL(str)); } catch {}
    })();
  }, [mergedData, navigate]);

  if (isTransferred) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl border border-yellow-500/30 text-center max-w-lg w-full shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Ghi nhận thanh toán!</h2>
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left border border-gray-600">
             <p className="text-sm text-gray-300">Mã đơn hàng: <span className="font-mono text-yellow-400 font-bold">BOOKING{mergedData?.bookingId}</span></p>
             <p className="text-sm text-gray-300">Khách hàng: <span className="text-white">{mergedData?.customerName}</span></p>
          </div>
          <p className="text-gray-300 mb-6 text-base leading-relaxed">
            Vui lòng liên hệ với Chạm qua Fanpage (kèm bill chuyển khoản) để Admin xác nhận và gửi vé cho bạn.
            <br/><br/>
            <span className="text-sm text-yellow-400/90 italic">* Chúng tôi đang bảo trì hệ thống tự động, rất mong quý khách thông cảm.</span>
          </p>
          <a href="https://www.facebook.com/chamshowmusic" target="_blank" rel="noopener noreferrer" 
             className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all">
            Nhắn tin Fanpage ngay <ExternalLink size={20} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex justify-center">
      <div className="max-w-xl w-full bg-gray-800/50 backdrop-blur-lg p-8 rounded-xl border border-yellow-500/20">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Thanh toán</h1>
        <div className="text-center">
          <img src={qrCodeSrc} alt="QR" className="mx-auto w-64 h-64 border-4 border-white rounded-lg mb-6" />
          <p className="text-red-400 mb-6 font-medium">Nội dung chuyển khoản: <span className="text-yellow-200 font-mono">BOOKING{mergedData?.bookingId}</span></p>
          <div className="bg-gray-700/50 p-6 rounded-lg mb-8 text-left">
            <p className="text-gray-300">Khách hàng: <span className="text-white">{mergedData?.customerName}</span></p>
            <p className="text-gray-300">Số lượng: <span className="text-white">{mergedData?.quantity} ghế</span></p>
            <p className="text-2xl font-bold text-yellow-400 mt-2">Tổng: {mergedData?.totalPrice.toLocaleString("vi-VN")}đ</p>
          </div>
          <button onClick={() => setIsTransferred(true)} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg shadow-lg">
            Tôi đã chuyển khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;