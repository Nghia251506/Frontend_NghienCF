// src/pages/Home.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  createdAt?: string | number | Date;
};

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_FULL = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    items: shows,
    defaultId,
    loading,
  } = useSelector((s: RootState) => s.shows);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    dispatch(hydrateDefaultShow());
    dispatch(fetchShows());
  }, [dispatch]);

  // ── Default show (từ BE hoặc localStorage) ──────────────────────────────
  const currentShow = useMemo<ShowLike | null>(() => {
    if (!shows || shows.length === 0) return null;
    const fromBackend = shows.find(
      (s: any) => s.isDefault === "Active" || s.isDefault === true,
    );
    if (fromBackend) return fromBackend as ShowLike;
    if (defaultId != null) {
      const fromLocal = shows.find((s: any) => s.id === defaultId);
      if (fromLocal) return fromLocal as ShowLike;
    }
    return shows[0] as ShowLike;
  }, [shows, defaultId]);

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
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentShow.location)}`;
    }
    return null;
  }, [currentShow]);

  // ── Shows trong tháng này (dựa theo date) ───────────────────────────────
  const now = new Date();

  const upcomingShows = useMemo(() => {
    if (!shows || shows.length === 0) return [];
    return shows
      .filter((s: any) => {
        const showDate = new Date(s.date);
        // Chỉ lấy các show có thời gian >= thời gian hiện tại
        return showDate.getTime() >= now.getTime();
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) as ShowLike[];
  }, [shows]);

  // Xác định tháng hiển thị: Nếu còn show, lấy tháng của show gần nhất. Nếu hết, lấy tháng hiện tại.
  const displayMonthInfo = useMemo(() => {
    if (upcomingShows.length > 0) {
      const firstShowDate = new Date(upcomingShows[0].date as any);
      return {
        month: firstShowDate.getMonth() + 1,
        year: firstShowDate.getFullYear(),
      };
    }
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }, [upcomingShows]);

  // Giữ lại logic availableDays và filteredShows dựa trên danh sách upcomingShows mới
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    upcomingShows.forEach((s) => {
      if (s.date) days.add(new Date(s.date as any).getDay());
    });
    return days;
  }, [upcomingShows]);

  const filteredShows = useMemo(() => {
    if (selectedDay === null) return upcomingShows;
    return upcomingShows.filter(
      (s) => s.date && new Date(s.date as any).getDay() === selectedDay,
    );
  }, [upcomingShows, selectedDay]);

  // ── Carousel logic ───────────────────────────────────────────────────────
  const loopedShows = useMemo(
    () =>
      filteredShows.length > 1
        ? [...filteredShows, ...filteredShows]
        : filteredShows,
    [filteredShows],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const measureHalfWidth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 0;
    const gap = parseFloat(
      getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || "0",
    );
    const children = Array.from(rail.children) as HTMLElement[];
    const half = Math.floor(children.length / 2);
    let w = 0;
    for (let i = 0; i < half; i++) w += children[i].offsetWidth + gap;
    return w;
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    if (railRef.current) railRef.current.style.transform = "translate3d(0,0,0)";
  }, [filteredShows]);

  useEffect(() => {
    if (loopedShows.length <= 1) return;
    let raf = 0;
    let last = performance.now();
    let base = measureHalfWidth();
    const speed = 0.1;

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
    const onResize = () => {
      base = measureHalfWidth();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [loopedShows.length, measureHalfWidth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    let base = 0;
    const recalc = () => {
      base = measureHalfWidth();
    };
    const getX = (e: PointerEvent) => e.clientX;
    const down = (e: PointerEvent) => {
      dragging = true;
      setPaused(true);
      lastX = getX(e);
      (el as any).setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = getX(e) - lastX;
      lastX = getX(e);
      offsetRef.current -= dx;
      if (base > 0) {
        offsetRef.current %= base;
        if (offsetRef.current < 0) offsetRef.current += base;
      }
      if (railRef.current)
        railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      e.preventDefault();
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

  const nudge = (dir: -1 | 1) => {
    const viewW = containerRef.current?.clientWidth ?? 0;
    offsetRef.current += dir * (viewW * 0.8);
    const base = measureHalfWidth();
    if (base > 0) {
      offsetRef.current %= base;
      if (offsetRef.current < 0) offsetRef.current += base;
    }
    if (railRef.current)
      railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
  };

  return (
    <div className="relative">
      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — SHOWS TRONG THÁNG NÀY (lên trên cùng)
      ════════════════════════════════════════════════════════════ */}
      <section className="pt-10 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold !text-white">
                🎵 Shows tháng {displayMonthInfo.month}/{displayMonthInfo.year}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "rgb(var(--color-muted))" }}
              >
                {upcomingShows.length > 0
                  ? `${upcomingShows.length} show sắp diễn ra`
                  : "Hiện chưa có show mới sắp diễn ra"}
              </p>
            </div>

            {upcomingShows.length > 0 && (
              <span
                className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent)",
                  borderColor:
                    "color-mix(in srgb, rgb(var(--color-primary)) 40%, transparent)",
                  color: "rgb(var(--color-primary))",
                }}
              >
                {filteredShows.length} show
                {selectedDay !== null ? ` (${DAY_FULL[selectedDay]})` : ""}
              </span>
            )}
          </div>

          {/* ── Bộ lọc theo thứ ── */}
          {availableDays.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedDay(null)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${
                  selectedDay === null
                    ? "text-black border-transparent"
                    : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                }`}
                style={
                  selectedDay === null
                    ? {
                        backgroundImage:
                          "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                      }
                    : { backgroundColor: "transparent" }
                }
              >
                Tất cả
              </button>

              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                if (!availableDays.has(day)) return null;
                const isActive = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isActive ? null : day)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${
                      isActive
                        ? "text-black border-transparent"
                        : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundImage:
                              "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                          }
                        : { backgroundColor: "transparent" }
                    }
                  >
                    {DAY_FULL[day]}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Carousel / Empty state ── */}
          {filteredShows.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl border"
              style={{
                backgroundColor:
                  "color-mix(in srgb, rgb(var(--color-surface)) 40%, transparent)",
                borderColor:
                  "color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent)",
              }}
            >
              <p className="text-white/60 text-sm">
                {upcomingShows.length === 0
                  ? "Chưa có show nào trong tháng này."
                  : `Không có show vào ${DAY_FULL[selectedDay!]} trong tháng này.`}
              </p>
            </div>
          ) : filteredShows.length === 1 ? (
            /* TRƯỜNG HỢP 1 SHOW: Hiển thị Card căn giữa, không dùng Carousel */
            <div className="flex justify-center py-4">
              <div
                className="w-full max-w-[280px] sm:max-w-[320px] cursor-pointer group"
                onClick={() => navigate(`/booking/${filteredShows[0].id}`)}
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-800 relative shadow-2xl">
                  <img
                    src={filteredShows[0].bannerUrl || "/default.jpg"}
                    alt={filteredShows[0].title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-black bg-primary"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, var(--button-from) 0%, var(--button-to) 100%)",
                    }}
                  >
                    {
                      DAY_LABELS[
                        new Date(filteredShows[0].date as any).getDay()
                      ]
                    }
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                    {filteredShows[0].title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(filteredShows[0].date as any).toLocaleDateString(
                      "vi-VN",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative overflow-hidden select-none"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              style={{ touchAction: "none" }}
            >
              <button
                aria-label="Trước"
                onClick={() => nudge(-1)}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20
                           w-9 h-9 items-center justify-center rounded-full
                           bg-white/15 hover:bg-white/25 backdrop-blur
                           border border-white/10 text-white"
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Sau"
                onClick={() => nudge(1)}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20
                           w-9 h-9 items-center justify-center rounded-full
                           bg-white/15 hover:bg-white/25 backdrop-blur
                           border border-white/10 text-white"
              >
                <ChevronRight />
              </button>

              <div className="px-0 md:px-10">
                <div
                  ref={railRef}
                  className="flex gap-4 sm:gap-6 will-change-transform"
                  style={{
                    transform: "translate3d(0,0,0)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {loopedShows.map((show, idx) => (
                    <div
                      key={`${show.id}-${idx}`}
                      className="min-w-[180px] sm:min-w-[220px] cursor-pointer group"
                      onClick={() => navigate(`/booking/${show.id}`)}
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 relative">
                        <img
                          src={show.bannerUrl || "/default.jpg"}
                          alt={show.title}
                          className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          draggable={false}
                          onLoad={() => {
                            requestAnimationFrame(() => {
                              if (railRef.current)
                                railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
                            });
                          }}
                        />
                        <div
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-black"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                          }}
                        >
                          {show.date
                            ? DAY_LABELS[new Date(show.date as any).getDay()]
                            : ""}
                        </div>
                      </div>
                      <div className="mt-3 px-1">
                        <div className="text-sm sm:text-base font-semibold !text-white line-clamp-2 leading-snug">
                          {show.title}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 mt-1">
                          {show.date
                            ? new Date(show.date as any).toLocaleDateString(
                                "vi-VN",
                                {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — DEFAULT SHOW  (nền màu + ảnh nổi glow)
      ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-screen flex items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 mt-6">
        {/* ── Nền màu dựa theo --color-primary ── */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 18% 50%,
                color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent) 0%,
                transparent 70%),
              radial-gradient(ellipse 55% 75% at 88% 25%,
                color-mix(in srgb, rgb(var(--color-primary)) 11%, transparent) 0%,
                transparent 65%),
              radial-gradient(ellipse 40% 40% at 60% 85%,
                color-mix(in srgb, rgb(var(--color-primary)) 7%, transparent) 0%,
                transparent 60%),
              rgb(var(--color-bg))
            `,
          }}
        />

        {/* Noise texture overlay nhẹ */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />

        {/* Đường kẻ ngang trang trí mờ */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px"
              style={{
                top: `${12 + i * 12}%`,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  color-mix(in srgb, rgb(var(--color-primary)) ${Math.max(1, 5 - i * 0.6)}%, transparent) 50%,
                  transparent 100%)`,
              }}
            />
          ))}
        </div>

        {/* ── Content: split 2 cột ── */}
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            {/* ── Cột trái: Text ── */}
            <div className="order-2 lg:order-1 flex flex-col gap-6">
              {/* Label pill */}
              <div
                className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, rgb(var(--color-primary)) 12%, transparent)",
                  borderColor:
                    "color-mix(in srgb, rgb(var(--color-primary)) 35%, transparent)",
                  color: "rgb(var(--color-primary))",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "rgb(var(--color-primary))" }}
                />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Show nổi bật
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgb(var(--color-primary)) 0%, color-mix(in srgb, rgb(var(--color-primary)) 55%, #fff) 55%, #fff 100%)",
                }}
              >
                {currentShow?.title ??
                  (loading ? "Đang tải..." : "MUSIC NIGHT")}
              </h1>

              {/* Slogan */}
              <p
                className="text-lg sm:text-xl leading-relaxed"
                style={{
                  color:
                    "color-mix(in srgb, rgb(var(--color-text)) 80%, transparent)",
                }}
              >
                {currentShow?.slogan ??
                  "Thông tin show diễn sẽ được cập nhật sớm."}
              </p>

              {/* Description */}
              {currentShow?.description && (
                <p
                  className="text-sm sm:text-base leading-relaxed line-clamp-4"
                  style={{
                    color:
                      "color-mix(in srgb, rgb(var(--color-text)) 58%, transparent)",
                  }}
                >
                  {currentShow.description}
                </p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2.5">
                {currentShow?.date && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, rgb(var(--color-surface)) 75%, transparent)",
                      color: "rgb(var(--color-text))",
                    }}
                  >
                    <Calendar
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "rgb(var(--color-primary))" }}
                    />
                    {new Date(currentShow.date as any).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                {currentShow?.location && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, rgb(var(--color-surface)) 75%, transparent)",
                      color: "rgb(var(--color-text))",
                    }}
                  >
                    <MapPin
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "rgb(var(--color-primary))" }}
                    />
                    {mapsLink ? (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                        style={{ color: "rgb(var(--color-primary))" }}
                      >
                        {currentShow.location}
                      </a>
                    ) : (
                      currentShow.location
                    )}
                  </div>
                )}
                {currentShow?.totalSeats && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, rgb(var(--color-surface)) 75%, transparent)",
                      color: "rgb(var(--color-text))",
                    }}
                  >
                    <Users
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "rgb(var(--color-primary))" }}
                    />
                    {currentShow.totalSeats} ghế
                    {typeof currentShow.remainingSeats === "number" && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                          currentShow.remainingSeats > 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        còn {currentShow.remainingSeats}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div>
                <Link
                  to={`/booking/${currentShow?.id}`}
                  className="inline-flex items-center gap-2 font-bold py-3.5 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    color: "#000",
                    backgroundImage:
                      "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                    boxShadow:
                      "0 8px 32px color-mix(in srgb, rgb(var(--color-primary)) 45%, transparent)",
                  }}
                >
                  Đặt ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* ── Cột phải: Ảnh nổi glow ── */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-60 sm:w-72 lg:w-80 xl:w-[340px]">
                {/* Glow blob lớn phía sau */}
                <div
                  className="absolute rounded-3xl -z-10"
                  style={{
                    inset: "-20px",
                    filter: "blur(48px)",
                    background: `radial-gradient(ellipse at 50% 55%,
                      color-mix(in srgb, rgb(var(--color-primary)) 60%, transparent) 0%,
                      transparent 68%)`,
                  }}
                />

                {/* Glow vòng ngoài mờ hơn */}
                <div
                  className="absolute rounded-3xl -z-10"
                  style={{
                    inset: "-40px",
                    filter: "blur(80px)",
                    background: `radial-gradient(ellipse at 50% 50%,
                      color-mix(in srgb, rgb(var(--color-primary)) 25%, transparent) 0%,
                      transparent 65%)`,
                  }}
                />

                {/* Viền gradient quanh ảnh */}
                <div
                  className="absolute -inset-[2px] rounded-3xl"
                  style={{
                    background: `linear-gradient(140deg,
                      color-mix(in srgb, rgb(var(--color-primary)) 85%, #fff) 0%,
                      color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent) 45%,
                      transparent 100%)`,
                    zIndex: 0,
                  }}
                />

                {/* Ảnh chính */}
                <div
                  className="relative rounded-3xl overflow-hidden aspect-[3/4]"
                  style={{
                    zIndex: 1,
                    boxShadow: `
                      0 0 0 1px color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent),
                      0 32px 72px -8px color-mix(in srgb, rgb(var(--color-primary)) 45%, #000),
                      0 12px 28px -6px rgba(0,0,0,0.65)
                    `,
                  }}
                >
                  <img
                    src={
                      currentShow?.bannerUrl?.trim()
                        ? currentShow.bannerUrl
                        : "/default.jpg"
                    }
                    alt={currentShow?.title ?? "Show"}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient fade dưới ảnh */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(to top,
                        color-mix(in srgb, rgb(var(--color-bg)) 50%, transparent) 0%,
                        transparent 42%)`,
                    }}
                  />
                </div>

                {/* Badge "Nổi bật" — góc trên phải */}
                <div
                  className="absolute -top-3 -right-3 z-10 px-3 py-1.5 rounded-full text-xs font-bold text-black"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))) 0%, var(--button-to, rgb(var(--color-primary))) 100%)",
                    boxShadow:
                      "0 4px 16px color-mix(in srgb, rgb(var(--color-primary)) 55%, transparent)",
                  }}
                >
                  ⭐ Nổi bật
                </div>

                {/* Badge vé còn lại — góc dưới trái */}
                {typeof currentShow?.remainingSeats === "number" && (
                  <div
                    className="absolute -bottom-3 -left-3 z-10 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, rgb(var(--color-surface)) 92%, transparent)",
                      borderColor:
                        "color-mix(in srgb, rgb(var(--color-primary)) 35%, transparent)",
                      color: "rgb(var(--color-text))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    🎟 Còn {currentShow.remainingSeats} ghế
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
