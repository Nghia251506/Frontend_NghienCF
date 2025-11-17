import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Dùng useParams để lấy showId từ URL
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { fetchShows, hydrateDefaultShow } from "../redux/ShowSlice";
import { fetchByShowId } from "../redux/TicketTypeSlice";
import { createBooking } from "../redux/BookingSlice";
import { useBooking } from "../contexts/BookingContext";
import { Star, Check, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import DOMPurify from "dompurify"; // ✅ sanitize HTML mô tả
import banner from "../data/logo_chamkhoanhkhac.jpg"

type BookingDataForContext = {
  customerName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  seatNumbers?: string[];
  bookingId?: number;
  paymentQrUrl?: string;
  paymentQrImage?: string;
  paymentQrString?: string;
};

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

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { showId } = useParams<{ showId: string }>(); // Lấy showId từ URL
  const dispatch = useDispatch<AppDispatch>();
  const { setBookingData } = useBooking();
  const formRef = useRef<HTMLDivElement>(null);

  // Redux state
  const { items: shows, defaultId, loading } = useSelector((s: RootState) => s.shows);
  const types = useSelector((s: RootState) => s.ticketTypes.items);
  const loadingTypes = useSelector((s: RootState) => s.ticketTypes.loading);

  // local state
  const selectedShowId = useMemo(() => {
    // Nếu showId có trong URL thì dùng showId từ URL, nếu không thì lấy mặc định
    return showId ? Number(showId) : defaultId;
  }, [showId, defaultId]);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
  });

  // 1) Tải danh sách show
  useEffect(() => {
    dispatch(hydrateDefaultShow());
    dispatch(fetchShows());
  }, [dispatch]);

  // 2) Fetch ticket types theo showId từ URL
  useEffect(() => {
    if (selectedShowId == null) return;
    dispatch(fetchByShowId(selectedShowId));
    setSelectedTypeId(null);
  }, [selectedShowId, dispatch]);

  // 4) Lọc types theo show
  const filteredTypes = useMemo(() => {
    return selectedShowId ? types.filter(t => t.showId === selectedShowId) : [];
  }, [types, selectedShowId]);

  const selectedType = useMemo(
    () => filteredTypes.find((t) => t.id === selectedTypeId) || null,
    [filteredTypes, selectedTypeId]
  );

  const currentShow = useMemo(() => {
    if (!shows || shows.length === 0 || !selectedShowId) return null;

    return shows.find((show) => show.id === selectedShowId) || null;
  }, [shows, selectedShowId]);

  const remaining = useMemo(() => {
    if (!selectedType) return 0;
    return typeof selectedType.remainingQuantity === "number"
      ? selectedType.remainingQuantity
      : (selectedType.totalQuantity ?? 0);
  }, [selectedType]);

  const totalPrice = selectedType ? selectedType.price * formData.quantity : 0;

  const handleTypeSelect = (typeId: number) => {
    const t = filteredTypes.find((x) => x.id === typeId);
    if (!t) return;
    const remain = (t.remainingQuantity ?? t.totalQuantity ?? 0);
    if (remain <= 0) {
      toast.warn("Loại vé này đã hết.");
      return;
    }
    setSelectedTypeId(typeId);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedShowId == null) {
      toast.error("Không xác định được show mặc định");
      return;
    }
    if (!selectedType) {
      toast.error("Vui lòng chọn loại vé");
      return;
    }
    if (!formData.customerName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    if (!/^0\d{9,10}$/.test(formData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    if (formData.quantity <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }
    if (formData.quantity > remaining) {
      toast.error(`Chỉ còn ${remaining} vé cho loại này`);
      return;
    }

    try {
      const dto = {
        showId: selectedShowId,
        ticketTypeId: selectedType.id!,
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        quantity: formData.quantity,
      };

      const res = await dispatch(createBooking(dto)).unwrap(); // BookingResponseDto

      const payload: BookingDataForContext = {
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        combo: selectedType.name,
        quantity: formData.quantity,
        totalPrice: res.totalAmount,
        bookingId: res.bookingId,
        paymentQrUrl: res.paymentQrUrl,
        paymentQrImage: res.paymentQrImage,
        paymentQrString: res.paymentQrString,
      };

      setBookingData(payload);
      sessionStorage.setItem("bookingData", JSON.stringify(payload));
      navigate("/payment", { state: { bookingData: payload } });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo đơn thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  const mapsLink = useMemo(() => {
      if (!currentShow) return null;
      if (currentShow.location) return currentShow.location;
  
      if (
        typeof currentShow.location === "number" &&
        typeof currentShow.location === "number"
      ) {
        return `https://www.google.com/maps/search/?api=1&query=${currentShow.location},${currentShow.location}`;
      }
      if (currentShow.location?.trim()) {
        const q = encodeURIComponent(currentShow.location);
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
      }
      return null;
    }, [currentShow]);

  // ======================= UI =======================
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* --- SECTION: Thông tin show theo id trên URL --- */}
        <div className="mb-10">
          <h1 className="text-xl sm:text-2xl font-bold !text-white mb-4 ">
            {currentShow?.title}
          </h1>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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


            {/* Tiêu đề show */}
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

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold !text-white mb-4">
            Chọn gói combo của bạn
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Lựa chọn trải nghiệm phù hợp nhất
          </p>
        </div>

        {/* Hidden showId (nếu cần) */}
        <form style={{ display: "none" }}>
          <input type="hidden" name="showId" value={selectedShowId ?? ""} readOnly />
        </form>

        {/* Grid Ticket Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {filteredTypes.map((tt) => {
            const isPopular = false;
            const remain = (tt.remainingQuantity ?? 0);
            const outOfStock = remain <= 0;
            const active = selectedTypeId === tt.id;

            return (
              <div
                key={tt.id}
                className={`relative bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  isPopular ? "border-yellow-500 shadow-lg shadow-yellow-500/25" : "border-gray-600 hover:border-yellow-500/50"
                } ${active ? "ring-2 ring-yellow-500" : ""} ${outOfStock ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !outOfStock && handleTypeSelect(tt.id!)}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Phổ biến nhất
                    </div>
                  </div>
                )}

                {outOfStock && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-700 text-white text-[11px] sm:text-xs font-bold tracking-wide px-2.5 py-1 rounded-full shadow-lg shadow-red-900/30 border border-white/10 uppercase">
                      Sold out
                    </span>
                  </div>
                )}

                <div className="text-center mb-5">
                  <h3 className="text-xl sm:text-2xl font-bold !text-white mb-2">
                    {tt.name}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-bold !text-yellow-400">
                    {tt.price.toLocaleString("vi-VN")}đ
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    Còn lại:{" "}
                    <span className={`font-semibold ${remain === 0 ? "text-red-400" : "text-green-400"}`}>
                      {remain}
                    </span>
                  </div>
                </div>

                {tt.description && (
                  <div
                    className="text-sm text-gray-300 mb-6 leading-relaxed"
                    onClick={(e) => e.stopPropagation()}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tt.description || "") }}
                  />
                )}

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start text-gray-300 text-sm sm:text-base">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    Màu khu vực:{" "}
                    <span className="inline-block ml-1 rounded px-2 py-0.5" style={{ background: tt.color, color: "#111" }}>
                      {tt.color}
                    </span>
                  </li>
                </ul>

                <button
                  className={`w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                    outOfStock
                      ? "bg-gray-600 text-white cursor-not-allowed"
                      : active
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                  disabled={outOfStock}
                >
                  {outOfStock ? "Hết vé" : active ? "Đang chọn" : "Chọn gói này"}
                </button>
              </div>
            );
          })}

          {filteredTypes.length === 0 && (
            <div className="col-span-full text-center !text-gray-400">
              {loadingTypes ? "Đang tải loại vé…" : "Chưa có loại vé cho show này"}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div ref={formRef} className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
            <h2 className="text-xl sm:text-2xl font-bold !text-white mb-6 text-center">
              Thông tin đặt chỗ
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="showId" value={selectedShowId ?? ""} readOnly />

              <div>
                <label className="block !text-white font-medium mb-2">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg !text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block !text-white font-medium mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg !text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                  placeholder="0xxx xxx xxx"
                />
              </div>

              <div>
                <label className="block !text-white font-medium mb-2">Số lượng ghế</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, remaining || 1)}
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg !text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                />
                {selectedType && (
                  <p className="mt-2 text-xs text-gray-400">Còn lại: {remaining} ghế</p>
                )}
              </div>

              {totalPrice > 0 && (
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-yellow-500/20">
                  <div className="flex justify-between items-center text-lg sm:text-xl font-bold !text-white">
                    <span>Tổng tiền:</span>
                    <span className="text-yellow-400">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedType}
                className={`w-full font-bold py-3 sm:py-4 rounded-lg transition-colors transform hover:scale-[1.02] shadow-lg hover:shadow-yellow-500/25 text-sm sm:text-base ${
                  selectedType
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black"
                    : "bg-gray-600 text-white cursor-not-allowed"
                }`}
              >
                Đặt ngay
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
