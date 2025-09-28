import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useBooking } from '../contexts/BookingContext';
import { Clock, CheckCircle } from 'lucide-react';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { bookingData } = useBooking();
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [countdown, setCountdown] = useState<number>(0);
  const [showTicket, setShowTicket] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
      return;
    }

    // Generate QR Code for payment
    const generateQRCode = async () => {
      const paymentData = {
        amount: bookingData.totalPrice,
        orderId: `TICKET-${Date.now()}`,
        description: `Vé ${bookingData.combo} - ${bookingData.customerName}`
      };
      
      try {
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(paymentData));
        setQrCode(qrCodeUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [bookingData, navigate]);

  const handlePayment = () => {
    setPaymentStatus('processing');
    setCountdown(15);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
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

  if (!bookingData) {
    return <div>Loading...</div>;
  }

  if (showTicket) {
    return <TicketDisplay bookingData={bookingData} />;
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">Thanh toán</h1>
          
          {paymentStatus === 'pending' && (
            <div className="text-center">
              <div className="mb-6">
                <img 
                  src={qrCode} 
                  alt="QR Code Payment" 
                  className="mx-auto w-48 h-48 sm:w-64 sm:h-64 border-4 border-white rounded-lg"
                />
              </div>
              
              <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Chi tiết đơn hàng</h3>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p>Khách hàng: {bookingData.fullName}</p>
                  <p>Gói vé: {bookingData.combo}</p>
                  <p>Số lượng: {bookingData.quantity} vé</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">
                    Tổng tiền: {bookingData.totalPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm sm:text-base">Quét mã QR để thanh toán qua Tingee</p>
              
              <button
                onClick={handlePayment}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
              >
                Tôi đã thanh toán
              </button>
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

const TicketDisplay: React.FC<{ bookingData: BookingData }> = ({ bookingData }) => {
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30">
          {/* Background Image */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Ticket Content */}
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MUSIC NIGHT
              </h1>
              <p className="text-gray-300 text-sm">Concert Ticket</p>
            </div>

            {/* Ticket Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Tên khách hàng</p>
                <p className="text-white font-semibold text-base sm:text-lg">{bookingData.fullName}</p>
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

              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Số ghế</p>
                <p className="text-white font-semibold text-sm sm:text-base break-all">{bookingData.seatNumbers.join(', ')}</p>
              </div>

              <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
                <p className="text-gray-400 text-sm">Thời gian</p>
                <p className="text-white font-semibold text-sm sm:text-base">15/02/2025 - 20:00</p>
              </div>
            </div>

            {/* Bottom */}
            <div className="text-center">
              <div className="w-full h-8 bg-gradient-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 rounded-full mb-4 flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-xs">Vui lòng xuất trình vé này tại cửa vào</p>
              <p className="text-yellow-400 text-xs font-semibold">#{Date.now().toString().slice(-8)}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => window.location.href = '/'}
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