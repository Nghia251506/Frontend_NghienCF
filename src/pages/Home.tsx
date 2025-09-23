import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')"
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent leading-tight">
            MUSIC NIGHT
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200 px-4">
            Đêm nhạc đặc biệt với những ca khúc bất hủ
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
          >
            Đặt vé ngay
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </section>

      {/* Concert Info */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Thông tin show diễn</h2>
            <p className="text-gray-400 text-base sm:text-lg">Một đêm nhạc không thể bỏ lỡ</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Thời gian</h3>
              <p className="text-gray-300 text-sm sm:text-base">15/02/2025 - 20:00</p>
              <p className="text-gray-400 text-sm">Thứ Bảy</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Địa điểm</h3>
              <p className="text-gray-300 text-sm sm:text-base">Nhà hát Hòa Bình</p>
              <p className="text-gray-400 text-sm">TP. Hồ Chí Minh</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors sm:col-span-2 lg:col-span-1">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sức chứa</h3>
              <p className="text-gray-300 text-sm sm:text-base">2,000 ghế</p>
              <p className="text-gray-400 text-sm">Còn lại: 1,247 vé</p>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-lg p-6 sm:p-8 lg:p-12 rounded-2xl border border-yellow-500/20">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">Về show diễn</h3>
            <div className="prose prose-lg prose-gray max-w-none">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Music Night là một đêm nhạc đặc biệt quy tụ những nghệ sĩ hàng đầu Việt Nam. 
                Với không gian âm nhạc đẳng cấp, âm thanh chất lượng cao và sân khấu hoành tráng, 
                chúng tôi hứa hẹn mang đến cho bạn những trải nghiệm âm nhạc không thể nào quên.
              </p>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-4">
                Chương trình gồm những ca khúc hit được yêu thích nhất, kết hợp với công nghệ 
                ánh sáng hiện đại, tạo nên một bữa tiệc thị giác và thính giác tuyệt vời.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;