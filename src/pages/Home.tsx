// src/pages/Home.tsx
import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  isDefault: string;
  totalSeats?: number;
  remainingSeats?: number;
};
// console.log("ShowDefault: ")
const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items: shows, defaultId, loading } = useSelector((s: RootState) => s.shows);
  const resumeTimerRef = useRef<number | null>(null);
  const startRef = useRef<() => void>(() => { });
  const stopRef = useRef<() => void>(() => { });


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

  // Lọc các show sắp diễn ra
  const upcomingShows = useMemo(() => {
    if (!shows || shows.length === 0) return [];
    const now = Date.now();
    return shows
      .filter(s => new Date(s.date).getTime() > now) // Lọc show sắp diễn ra
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 99); // Lấy tối đa 5 show sắp diễn ra
  }, [shows]);
  const top5 = useMemo(() => upcomingShows.slice(0, 99), [upcomingShows]);
  const loopedShows = useMemo(() => (top5.length > 1 ? [...top5, ...top5] : top5), [top5]);

  const containerRef = useRef<HTMLDivElement>(null); // khung nhìn
  const railRef = useRef<HTMLDivElement>(null);       // dải item chạy ngang
  const offsetRef = useRef(0);                        // vị trí hiện tại (px)
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // đo bề rộng của "nửa đầu" (5 item gốc) để loop vô hạn
  const measureHalfWidth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 0;
    const gap =
      parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || "0");
    const children = Array.from(rail.children) as HTMLElement[];
    const half = Math.floor(children.length / 2);
    let w = 0;
    for (let i = 0; i < half; i++) w += children[i].offsetWidth + gap;
    return w;
  }, []);

  // auto-run siêu mượt bằng rAF + translate3d
  useEffect(() => {
    if (loopedShows.length <= 1) return;
    let raf = 0;
    let last = performance.now();
    let base = measureHalfWidth();
    const speed = 0.1; // px/ms ~10.8px/s (tự chỉnh)

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const rail = railRef.current;
      if (rail && !pausedRef.current) {
        offsetRef.current += speed * dt;
        if (base > 0 && offsetRef.current >= base) offsetRef.current -= base;
        rail.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const onResize = () => { base = measureHalfWidth(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [loopedShows.length, measureHalfWidth]);

  // kéo/vuốt thủ công (pause khi đang kéo)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let lastX = 0;
    let base = 0;

    const recalc = () => { base = measureHalfWidth(); };

    const getX = (e: PointerEvent) => e.clientX;

    const down = (e: PointerEvent) => {
      dragging = true;
      setPaused(true);
      startX = lastX = getX(e);
      (el as any).setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const x = getX(e);
      const dx = x - lastX;
      lastX = x;
      // lùi offset theo hướng kéo (dx>0 kéo phải → offset giảm)
      offsetRef.current -= dx;
      if (base > 0) {
        // modulo để không tràn
        offsetRef.current %= base;
        if (offsetRef.current < 0) offsetRef.current += base;
      }
      if (railRef.current) {
        railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
      e.preventDefault(); // tránh cuộn trang
    };
    const up = () => {
      dragging = false;
      setPaused(false);
    };

    el.addEventListener("pointerdown", down, { passive: false });
    el.addEventListener("pointermove", move, { passive: false });
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    window.addEventListener("resize", recalc);
    recalc();

    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      window.removeEventListener("resize", recalc);
    };
  }, [measureHalfWidth]);

  // nút trái/phải: nhảy theo 80% chiều rộng viewport
  const nudge = (dir: -1 | 1) => {
    const viewW = containerRef.current?.clientWidth ?? 0;
    const step = viewW * 0.8;
    offsetRef.current += dir * step;
    // để liền mạch:
    const base = measureHalfWidth();
    if (base > 0) {
      offsetRef.current %= base;
      if (offsetRef.current < 0) offsetRef.current += base;
    }
    if (railRef.current) {
      railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
    }
  };
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
            to={`/booking/${currentShow?.id}`}
            className="inline-flex items-center font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{
              color: "#000",
              backgroundImage:
                "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
              boxShadow: "0 10px 25px rgba(0,0,0,.25)",
            }}
          >
            Đặt ngay
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
                {(currentShow?.totalSeats ?? "Đang cập nhật") + (currentShow ? " ghế" : "")}
              </p>
              {typeof currentShow?.remainingSeats === "number" && (
                <span
                  className={
                    "mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border " +
                    (currentShow.remainingSeats > 0
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30")
                  }
                >
                  Còn lại: {currentShow.remainingSeats}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mini Show Mới */}
      {top5.length > 0 && (
        <section className="mt-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold !text-white mb-6">
            Mini Show Mới
          </h2>

          <div
            ref={containerRef}
            className="relative mx-auto max-w-6xl overflow-hidden px-6 select-none"
            // pause resume (hover desktop, giữ tay mobile)
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ touchAction: "none" }} // cho pointer events mượt trên mobile
          >
            {/* Nút trái */}
            <button
              aria-label="Trước"
              onClick={() => nudge(-1)}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20
                   w-9 h-9 items-center justify-center rounded-full
                   bg-white/15 hover:bg-white/25 backdrop-blur
                   border border-white/10 text-white"
            >
              <ChevronLeft/>
            </button>

            {/* Nút phải */}
            <button
              aria-label="Sau"
              onClick={() => nudge(1)}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20
                   w-9 h-9 items-center justify-center rounded-full
                   bg-white/15 hover:bg-white/25 backdrop-blur
                   border border-white/10 text-white"
            >
              <ChevronRight/>
            </button>

            {/* Dải item chạy ngang */}
            <div
              ref={railRef}
              className="flex gap-6 will-change-transform"
              style={{
                transform: "translate3d(0,0,0)",
                // giúp GPU compositing mượt hơn
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {loopedShows.map((show, idx) => (
                <div
                  key={`${show.id}-${idx}`}
                  className="min-w-[220px] sm:min-w-[260px] cursor-pointer"
                  onClick={() => navigate(`/booking/${show.id}`)}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-700">
                    <img
                      src={show.bannerUrl || "/default.jpg"}
                      alt={show.title}
                      className="w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                      onLoad={() => {
                        // ảnh load xong đo lại để loop mượt
                        requestAnimationFrame(() => {
                          const base = measureHalfWidth();
                          // “kích” transform lại để sync khi base đổi
                          if (railRef.current) {
                            railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
                          }
                        });
                      }}
                      draggable={false}
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm sm:text-base font-semibold !text-white line-clamp-2">
                      {show.title}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 mt-1">
                      {new Date(show.date as any).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
