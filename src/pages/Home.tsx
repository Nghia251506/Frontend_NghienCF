import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { fetchShows, hydrateDefaultShow } from "../redux/ShowSlice";

type ShowLike = {
  id: number;
  title?: string;
  slogan?: string;
  description?: string;
  bannerUrl?: string;
  location?: string;
  date?: string | number | Date;
  capacity?: number | string;
  // các field dưới chỉ dùng nếu bạn đã có (sẽ null nếu chưa đổi DB)
  locationUrl?: string;
  locationLat?: number;
  locationLng?: number;
  locationPlaceId?: string;
};

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: shows, defaultId, loading } = useSelector((s: RootState) => s.shows);

  useEffect(() => {
    dispatch(hydrateDefaultShow());
    dispatch(fetchShows());
  }, [dispatch]);

  const currentShow = useMemo<ShowLike | null>(() => {
    if (!shows || shows.length === 0) return null;
    const byDefault = defaultId != null ? shows.find((s: any) => s.id === defaultId) : null;
    return (byDefault ?? shows[0] ?? null) as ShowLike | null;
  }, [shows, defaultId]);

  // Ảnh nền với fallback public/default.jpg
  const backgroundUrl = currentShow?.bannerUrl?.trim()
    ? currentShow.bannerUrl!
    : "/default.jpg";

  // Link Google Maps: ưu tiên locationUrl -> lat,lng -> address text
  const mapsLink = useMemo(() => {
    if (!currentShow) return null;

    if (currentShow.locationUrl) return currentShow.locationUrl;

    if (
      typeof currentShow.locationLat === "number" &&
      typeof currentShow.locationLng === "number"
    ) {
      return `https://www.google.com/maps/search/?api=1&query=${currentShow.locationLat},${currentShow.locationLng}`;
    }

    if (currentShow.location?.trim()) {
      const q = encodeURIComponent(currentShow.location);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }

    return null;
  }, [currentShow]);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent leading-tight">
            {currentShow?.title ?? (loading ? "Đang tải..." : "MUSIC NIGHT")}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200 px-4">
            {currentShow?.slogan ?? "Thông tin show diễn sẽ được cập nhật sớm."}
          </p>

          <div className="p-6 sm:p-8 lg:p-12 mb-2.5">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
              Về show diễn
            </h3>
            <div className="prose prose-lg prose-gray max-w-none ">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {currentShow?.description ?? "Thông tin show diễn sẽ được cập nhật sớm."}
              </p>
            </div>
          </div>

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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Thông tin show diễn
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">Một đêm nhạc không thể bỏ lỡ</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {/* Thời gian */}
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Thời gian</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                {currentShow
                  ? new Date(currentShow.date as any).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Đang cập nhật"}
              </p>
            </div>

            {/* Địa điểm (có link Google Maps) */}
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Địa điểm</h3>
              {currentShow?.location ? (
                mapsLink ? (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 underline underline-offset-4 text-sm sm:text-base"
                    title="Mở trên Google Maps"
                  >
                    {currentShow.location}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-gray-300 text-sm sm:text-base">{currentShow.location}</p>
                )
              ) : (
                <p className="text-gray-300 text-sm sm:text-base">Đang cập nhật</p>
              )}
            </div>

            {/* Sức chứa */}
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors sm:col-span-2 lg:col-span-1">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sức chứa</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                {(currentShow?.capacity ?? "Đang cập nhật") + (currentShow ? " ghế" : "")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
