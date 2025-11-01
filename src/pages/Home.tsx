// src/pages/Home.tsx
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
  locationUrl?: string;
  locationLat?: number;
  locationLng?: number;
  locationPlaceId?: string;
  isDefault:string;
};
// console.log("ShowDefault: ")
const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: shows, defaultId, loading } = useSelector((s: RootState) => s.shows);

  useEffect(() => {
    dispatch(hydrateDefaultShow());
    dispatch(fetchShows());
  }, [dispatch]);

  const currentShow = useMemo<ShowLike | null>(() => {
    if (!shows || shows.length === 0) return null;

    // 1. Ưu tiên show mà BE đánh dấu default
    const fromBackend = shows.find((s: any) => s.isDefault === "Active" || s.isDefault === true);
    if (fromBackend) return fromBackend as ShowLike;

    // 2. Nếu BE không có default thì mới dùng cái đã lưu trong localStorage
    if (defaultId != null) {
      const fromLocal = shows.find((s: any) => s.id === defaultId);
      if (fromLocal) return fromLocal as ShowLike;
    }
    
    // 3. Fallback
    return shows[0] as ShowLike;
  }, [shows, defaultId]);
  // Ảnh nền với fallback public/default.jpg
  const backgroundUrl = currentShow?.bannerUrl?.trim()
    ? currentShow.bannerUrl!
    : "/default.jpg";

  // Link Google Maps
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
        {/* overlay dùng surface/bg để trộn */}
        {/* <div className="absolute inset-0"
             style={{ backgroundColor: "color-mix(in srgb, rgb(var(--color-bg)) 70%, #000 30%)" }} /> */}

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Title dùng gradient theo primary */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 leading-tight
                       bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(var(--color-primary)) 0%, color-mix(in srgb, rgb(var(--color-primary)) 75%, #fff 25%) 100%)",
            }}
          >
            {currentShow?.title ?? (loading ? "Đang tải..." : "MUSIC NIGHT")}
          </h1>

          <p
            className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 px-4"
            style={{ color: "rgb(var(--color-text))", opacity: 0.9 }}
          >
            {currentShow?.slogan ?? "Thông tin show diễn sẽ được cập nhật sớm."}
          </p>

          <div className="p-6 sm:p-8 lg:p-12 mb-2.5">
            <h3
              className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center"
              style={{ color: "rgb(var(--color-text))" }}
            >
              Về show diễn
            </h3>
            <div className="max-w-none">
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: "rgb(var(--color-text))", opacity: 0.85 }}
              >
                {currentShow?.description ?? "Thông tin show diễn sẽ được cập nhật sớm."}
              </p>
            </div>
          </div>

          {/* Nút dùng gradient theo --button-from / --button-to */}
          <Link
            to="/booking"
            className="inline-flex items-center font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{
              color: "#000",
              backgroundImage:
                "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
              boxShadow: "0 10px 25px rgba(0,0,0,.25)",
            }}
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
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "rgb(var(--color-text))" }}
            >
              Thông tin show diễn
            </h2>
            <p className="text-base sm:text-lg" style={{ color: "rgb(var(--color-muted))" }}>
              Một đêm nhạc không thể bỏ lỡ
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {/* Thời gian */}
            <div
              className="backdrop-blur-lg p-6 sm:p-8 rounded-xl transition-colors"
              style={{
                backgroundColor: "color-mix(in srgb, rgb(var(--color-surface)) 60%, #000 40%)",
                border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 25%, transparent)",
              }}
            >
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mb-4"
                style={{ color: "rgb(var(--color-primary))" }} />
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "rgb(var(--color-text))" }}>
                Thời gian
              </h3>
              <p style={{ color: "rgb(var(--color-text))", opacity: 0.85 }} className="text-sm sm:text-base">
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

            {/* Địa điểm */}
            <div
              className="backdrop-blur-lg p-6 sm:p-8 rounded-xl transition-colors"
              style={{
                backgroundColor: "color-mix(in srgb, rgb(var(--color-surface)) 60%, #000 40%)",
                border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 25%, transparent)",
              }}
            >
              <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mb-4"
                style={{ color: "rgb(var(--color-primary))" }} />
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "rgb(var(--color-text))" }}>
                Địa điểm
              </h3>

              {currentShow?.location ? (
                mapsLink ? (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 underline underline-offset-4 text-sm sm:text-base"
                    style={{ color: "rgb(var(--color-primary))" }}
                    title="Mở trên Google Maps"
                  >
                    {currentShow.location}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-sm sm:text-base" style={{ color: "rgb(var(--color-text))", opacity: 0.85 }}>
                    {currentShow.location}
                  </p>
                )
              ) : (
                <p className="text-sm sm:text-base" style={{ color: "rgb(var(--color-text))", opacity: 0.85 }}>
                  Đang cập nhật
                </p>
              )}
            </div>

            {/* Sức chứa */}
            <div
              className="backdrop-blur-lg p-6 sm:p-8 rounded-xl sm:col-span-2 lg:col-span-1 transition-colors"
              style={{
                backgroundColor: "color-mix(in srgb, rgb(var(--color-surface)) 60%, #000 40%)",
                border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 25%, transparent)",
              }}
            >
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mb-4"
                style={{ color: "rgb(var(--color-primary))" }} />
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "rgb(var(--color-text))" }}>
                Sức chứa
              </h3>
              <p className="text-sm sm:text-base" style={{ color: "rgb(var(--color-text))", opacity: 0.85 }}>
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
