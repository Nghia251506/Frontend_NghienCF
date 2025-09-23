import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import { combos } from '../data/combos';
import { useBooking } from '../contexts/BookingContext';
import { BookingData } from '../types';

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { setBookingData } = useBooking();
  const formRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    combo: '',
    quantity: 1
  });

  const handleComboSelect = (comboId: string) => {
    setFormData(prev => ({ ...prev, combo: comboId }));
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCombo = combos.find(c => c.id === formData.combo);
    if (!selectedCombo) return;

    // Generate seat numbers
    const seatNumbers = Array.from({ length: formData.quantity }, (_, i) => 
      `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${String(Math.floor(Math.random() * 100) + 1).padStart(2, '0')}`
    );

    const bookingData: BookingData = {
      fullName: formData.fullName,
      phone: formData.phone,
      combo: selectedCombo.name,
      quantity: formData.quantity,
      totalPrice: selectedCombo.price * formData.quantity,
      seatNumbers
    };

    setBookingData(bookingData);
    navigate('/payment');
  };

  const selectedCombo = combos.find(c => c.id === formData.combo);
  const totalPrice = selectedCombo ? selectedCombo.price * formData.quantity : 0;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Chọn gói vé của bạn</h1>
          <p className="text-gray-400 text-base sm:text-lg">Lựa chọn trải nghiệm phù hợp nhất</p>
        </div>

        {/* Combo Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={`relative bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                combo.popular 
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' 
                  : 'border-gray-600 hover:border-yellow-500/50'
              } ${
                formData.combo === combo.id 
                  ? 'ring-2 ring-yellow-500' 
                  : ''
              }`}
              onClick={() => handleComboSelect(combo.id)}
            >
              {combo.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Phổ biến nhất
                  </div>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{combo.name}</h3>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                  {combo.price.toLocaleString('vi-VN')}đ
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {combo.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-300 text-sm sm:text-base">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                  combo.popular
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                Chọn gói này
              </button>
            </div>
          ))}
        </div>

        {/* Booking Form */}
        <div ref={formRef} className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">Thông tin đặt vé</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                  placeholder="0xxx xxx xxx"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Gói vé</label>
                <select
                  required
                  value={formData.combo}
                  onChange={(e) => setFormData(prev => ({ ...prev, combo: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                >
                  <option value="">Chọn gói vé</option>
                  {combos.map((combo) => (
                    <option key={combo.id} value={combo.id}>
                      {combo.name} - {combo.price.toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Số lượng vé</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                />
              </div>

              {totalPrice > 0 && (
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-yellow-500/20">
                  <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-white">
                    <span>Tổng tiền:</span>
                    <span className="text-yellow-400">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 sm:py-4 rounded-lg transition-colors transform hover:scale-[1.02] shadow-lg hover:shadow-yellow-500/25 text-sm sm:text-base"
              >
                Đặt vé ngay
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;