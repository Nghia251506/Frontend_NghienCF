import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchShows } from "../redux/ShowSlice";
import { fetchByShowId } from "../redux/TicketTypeSlice";
import { createBooking } from "../redux/BookingSlice";
import { useBooking } from "../contexts/BookingContext";
import { Star, Check } from "lucide-react";
import { toast } from "react-toastify";

type BookingDataForContext = {
  customerName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  seatNumbers?: string[];
  bookingId?: number;
  paymentQrUrl?: string;
  paymentQrImage?: string;   // thêm để Payment dùng nếu backend trả ảnh base64
  paymentQrString?: string;  // thêm để Payment tự render ảnh từ chuỗi 000201...
};

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { setBookingData } = useBooking();
  const formRef = useRef<HTMLDivElement>(null);

  // Redux state
  const shows = useSelector((s: RootState) => s.shows.items);
  const showDefault = useSelector((s: RootState) => s.shows.selected) as { id?: number } | null;

  // Ticket types trong slice nên load theo showId (thunk fetchTicketTypes(showId))
  const types = useSelector((s: RootState) => s.ticketTypes.items);
  const loadingTypes = useSelector((s: RootState) => s.ticketTypes.loading);

  // local state
  const selectedShowId = showDefault?.id ?? null;
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
  });

  // 1) Tải danh sách show
  useEffect(() => {
    dispatch(fetchShows());
  }, [dispatch]);

  // 2) Chọn show mặc định (từ Redux) -> nếu không có, lấy show đầu tiên khi shows có dữ liệu
  useEffect(() => {
    const idFromDefault = showDefault?.id;
    if (idFromDefault && idFromDefault !== selectedShowId) {
      setSelectedShowId(idFromDefault);
      return;
    }
    if (!idFromDefault && shows.length > 0 && !selectedShowId) {
      setSelectedShowId(shows[0].id!);
    }
  }, [showDefault, shows, selectedShowId]);

  // 3) Mỗi khi selectedShowId đổi -> fetch ticket types theo show đó + reset loại vé đang chọn
  useEffect(() => {
    if (selectedShowId == null) return;
    // thunk nên nhận showId, ví dụ: fetchTicketTypes(selectedShowId)
    dispatch(fetchByShowId(selectedShowId));
    setSelectedTypeId(null); // reset chọn loại vé khi đổi show
  }, [selectedShowId, dispatch]);

  // 4) Lọc types theo selectedShowId (nếu slice đã chỉ trả về types của show hiện tại, đoạn này vẫn ok)
  const filteredTypes = useMemo(() => {
    if (!selectedShowId) return [];
    // Nếu slice đã chỉ chứa types của show hiện tại thì thực ra filter này không cần,
    // nhưng để an toàn ta vẫn filter theo showId.
    return types.filter((t) => t.showId === selectedShowId);
  }, [types, selectedShowId]);

  const selectedType = useMemo(
    () => filteredTypes.find((t) => t.id === selectedTypeId) || null,
    [filteredTypes, selectedTypeId]
  );

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

      console.log("📤 [BOOKING/SEND] DTO:", dto);
      const res = await dispatch(createBooking(dto)).unwrap(); // BookingResponseDto
      console.log("✅ [BOOKING/RECV] Response:", res);

      // Lưu vào context để Payment dùng
      setBookingData({
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        combo: selectedType.name,
        quantity: formData.quantity,
        totalPrice: res.totalAmount,
        bookingId: res.bookingId,
        paymentQrUrl: res.paymentQrUrl,
        paymentQrImage: res.paymentQrImage,     // nếu backend trả
        paymentQrString: res.paymentQrString,   // nếu backend trả
      } as BookingDataForContext);

      // Sau khi tạo booking, điều hướng sang trang thanh toán
      navigate("/payment");

      // (Tuỳ chọn) Nếu bạn muốn quay lại trang này thì mới cần refresh tồn kho:
      // dispatch(fetchTicketTypes(selectedShowId));

    } catch (err: any) {
      console.log("❌ [BOOKING/ERR]:", err?.response?.data ?? err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo đơn thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Chọn gói vé của bạn
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Lựa chọn trải nghiệm phù hợp nhất
          </p>
        </div>

        {/* Ô chọn show đã ẨN – nhưng vẫn fill showId qua input hidden để tránh lỗi form/validator */}
        <form style={{ display: "none" }}>
          <input type="hidden" name="showId" value={selectedShowId ?? ""} readOnly />
        </form>

        {/* Grid Ticket Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {filteredTypes.map((tt) => {
            const isPopular = false;
            const remain = (tt.remainingQuantity ?? tt.totalQuantity ?? 0);
            const outOfStock = remain <= 0;
            const active = selectedTypeId === tt.id;

            return (
              <div
                key={tt.id}
                className={`relative bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  isPopular
                    ? "border-yellow-500 shadow-lg shadow-yellow-500/25"
                    : "border-gray-600 hover:border-yellow-500/50"
                } ${active ? "ring-2 ring-yellow-500" : ""} ${
                  outOfStock ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
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

                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {tt.name}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                    {tt.price.toLocaleString("vi-VN")}đ
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    Còn lại:{" "}
                    <span
                      className={`font-semibold ${
                        remain === 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {remain}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start text-gray-300 text-sm sm:text-base">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    Màu khu vực:{" "}
                    <span
                      className="inline-block ml-1 rounded px-2 py-0.5"
                      style={{ background: tt.color, color: "#111" }}
                    >
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
            <div className="col-span-full text-center text-gray-400">
              {loadingTypes ? "Đang tải loại vé…" : "Chưa có loại vé cho show này"}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div ref={formRef} className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 sm:p-8 rounded-xl border border-yellow-500/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
              Thông tin đặt vé
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* hidden showId để fill dữ liệu */}
              <input type="hidden" name="showId" value={selectedShowId ?? ""} readOnly />

              <div>
                <label className="block text-white font-medium mb-2">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                  placeholder="0xxx xxx xxx"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Số lượng vé</label>
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm sm:text-base"
                />
                {selectedType && (
                  <p className="mt-2 text-xs text-gray-400">Còn lại: {remaining} vé</p>
                )}
              </div>

              {totalPrice > 0 && (
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-yellow-500/20">
                  <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-white">
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
