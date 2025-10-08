// src/pages/Booking.tsx
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
  paymentQrImage?: string;
  paymentQrString?: string;
};

const POLL_MS = 15000;

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { setBookingData } = useBooking();
  const formRef = useRef<HTMLDivElement>(null);

  // Redux
  const { items: shows, defaultId } = useSelector((s: RootState) => s.shows);
  const types = useSelector((s: RootState) => s.ticketTypes.items);
  const loadingTypes = useSelector((s: RootState) => s.ticketTypes.loading);

  // Local
  const selectedShowId = defaultId ?? (shows.length > 0 ? shows[0].id! : null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ customerName: "", phone: "", quantity: 1 });

  // 1) Load shows
  useEffect(() => {
    dispatch(fetchShows());
  }, [dispatch]);

  // 2) Khi có show -> load ticket types + polling + refresh on focus
  useEffect(() => {
    if (selectedShowId == null) return;

    dispatch(fetchByShowId(selectedShowId));
    setSelectedTypeId(null);

    const poll = window.setInterval(() => {
      dispatch(fetchByShowId(selectedShowId));
    }, POLL_MS);

    const onFocus = () => dispatch(fetchByShowId(selectedShowId));
    const onVisible = () => {
      if (document.visibilityState === "visible") dispatch(fetchByShowId(selectedShowId));
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [selectedShowId, dispatch]);

  // 3) Lọc types theo show
  const filteredTypes = useMemo(
    () => (selectedShowId ? types.filter((t) => t.showId === selectedShowId) : []),
    [types, selectedShowId]
  );

  // Nếu loại đang chọn biến mất -> reset
  useEffect(() => {
    if (selectedTypeId && !filteredTypes.some((t) => t.id === selectedTypeId)) {
      setSelectedTypeId(null);
    }
  }, [filteredTypes, selectedTypeId]);

  const selectedType = useMemo(
    () => filteredTypes.find((t) => t.id === selectedTypeId) || null,
    [filteredTypes, selectedTypeId]
  );

  const remaining = useMemo(() => {
    if (!selectedType) return 0;
    return typeof selectedType.remainingQuantity === "number"
      ? selectedType.remainingQuantity
      : selectedType.totalQuantity ?? 0;
  }, [selectedType]);

  const totalPrice = selectedType ? selectedType.price * formData.quantity : 0;

  const handleTypeSelect = (typeId: number) => {
    const t = filteredTypes.find((x) => x.id === typeId);
    if (!t) return;
    const remain = t.remainingQuantity ?? t.totalQuantity ?? 0;
    if (remain <= 0) {
      toast.warn("Loại vé này đã hết.");
      return;
    }
    setSelectedTypeId(typeId);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedShowId == null) return toast.error("Không xác định được show mặc định");
    if (!selectedType) return toast.error("Vui lòng chọn loại vé");
    if (!formData.customerName.trim()) return toast.error("Vui lòng nhập họ tên");
    if (!/^0\d{9,10}$/.test(formData.phone.trim())) return toast.error("Số điện thoại không hợp lệ");
    if (formData.quantity <= 0) return toast.error("Số lượng phải > 0");

    // Re-validate tồn kho
    try {
      const latestList = await dispatch(fetchByShowId(selectedShowId)).unwrap();
      const latestSelected = latestList.find((t: any) => t.id === selectedType.id);
      const latestRemain =
        (latestSelected?.remainingQuantity ?? latestSelected?.totalQuantity ?? 0) as number;
      if (formData.quantity > latestRemain) {
        toast.error(`Hiện chỉ còn ${latestRemain} vé cho loại này (vừa có thay đổi).`);
        return;
      }
    } catch {
      return toast.error("Không kiểm tra được tồn kho. Vui lòng thử lại.");
    }

    try {
      const dto = {
        showId: selectedShowId,
        ticketTypeId: selectedType.id!,
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        quantity: formData.quantity,
      };
      const res = await dispatch(createBooking(dto)).unwrap();

      const payload = {
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
      navigate("/payment", { replace: true, state: { bookingData: payload } });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Tạo đơn thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  return (
    <div
      className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
      style={{ color: "rgb(var(--color-text))", backgroundColor: "rgb(var(--color-bg))" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Chọn gói vé của bạn</h1>
          <p style={{ color: "rgb(var(--color-muted))" }} className="text-base sm:text-lg">
            Lựa chọn trải nghiệm phù hợp nhất
          </p>
        </div>

        {/* Grid Ticket Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {filteredTypes.map((tt) => {
            const isPopular = false;
            const remain = tt.remainingQuantity ?? tt.totalQuantity ?? 0;
            const outOfStock = remain <= 0;
            const active = selectedTypeId === tt.id;

            return (
              <div
                key={tt.id}
                className="relative backdrop-blur-lg p-6 sm:p-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: "rgba(255,255,255,.05)",
                  border: `1px solid ${
                    isPopular
                      ? "color-mix(in srgb, rgb(var(--color-primary)) 60%, transparent)"
                      : "rgba(255,255,255,.15)"
                  }`,
                  boxShadow: isPopular ? "0 8px 30px rgba(0,0,0,.35)" : undefined,
                  outline: active ? "2px solid rgb(var(--color-primary))" : "none",
                  opacity: outOfStock ? 0.6 : 1,
                  cursor: outOfStock ? "not-allowed" : "pointer",
                }}
                onClick={() => !outOfStock && handleTypeSelect(tt.id!)}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div
                      className="px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center"
                      style={{
                        color: "#000",
                        backgroundImage:
                          "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))), var(--button-to, rgb(var(--color-primary))))",
                      }}
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Phổ biến nhất
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{tt.name}</h3>
                  <div
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color: "rgb(var(--color-primary))" }}
                  >
                    {tt.price.toLocaleString("vi-VN")}đ
                  </div>
                  <div className="mt-2 text-sm" style={{ color: "rgb(var(--color-text))" }}>
                    Còn lại:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: remain === 0 ? "#ef4444" : "#22c55e" }}
                    >
                      {remain}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li
                    className="flex items-start text-sm sm:text-base"
                    style={{ color: "rgb(var(--color-text))" }}
                  >
                    <Check
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0 mt-0.5"
                      style={{ color: "rgb(var(--color-primary))" }}
                    />
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
                  className="w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  disabled={outOfStock}
                  style={
                    outOfStock
                      ? {
                          backgroundColor: "rgba(255,255,255,.15)",
                          color: "rgb(var(--color-text))",
                          cursor: "not-allowed",
                        }
                      : active
                      ? {
                          color: "#000",
                          backgroundImage:
                            "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))), var(--button-to, rgb(var(--color-primary))))",
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,.12)",
                          color: "rgb(var(--color-text))",
                        }
                  }
                >
                  {outOfStock ? "Hết vé" : active ? "Đang chọn" : "Chọn gói này"}
                </button>
              </div>
            );
          })}

          {filteredTypes.length === 0 && (
            <div className="col-span-full text-center" style={{ color: "rgb(var(--color-muted))" }}>
              {loadingTypes ? "Đang tải loại vé…" : "Chưa có loại vé cho show này"}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div ref={formRef} className="max-w-2xl mx-auto">
          <div
            className="backdrop-blur-lg p-6 sm:p-8 rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,.05)",
              border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent)",
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Thông tin đặt vé</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="showId" value={selectedShowId ?? ""} readOnly />

              <div>
                <label className="block font-medium mb-2">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.15)",
                    color: "rgb(var(--color-text))",
                    outlineColor: "rgb(var(--color-primary))",
                    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                  }}
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.15)",
                    color: "rgb(var(--color-text))",
                    outlineColor: "rgb(var(--color-primary))",
                  }}
                  placeholder="0xxx xxx xxx"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Số lượng vé</label>
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.15)",
                    color: "rgb(var(--color-text))",
                    outlineColor: "rgb(var(--color-primary))",
                  }}
                />
                {selectedType && (
                  <p className="mt-2 text-xs" style={{ color: "rgb(var(--color-muted))" }}>
                    Còn lại: {remaining} vé
                  </p>
                )}
              </div>

              {totalPrice > 0 && (
                <div
                  className="p-4 sm:p-6 rounded-lg"
                  style={{
                    backgroundColor: "rgba(255,255,255,.06)",
                    border: "1px solid color-mix(in srgb, rgb(var(--color-primary)) 20%, transparent)",
                  }}
                >
                  <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
                    <span>Tổng tiền:</span>
                    <span style={{ color: "rgb(var(--color-primary))" }}>
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedType}
                className="w-full font-bold py-3 sm:py-4 rounded-lg transition-transform hover:scale-[1.02] shadow-lg"
                style={
                  selectedType
                    ? {
                        color: "#000",
                        backgroundImage:
                          "linear-gradient(90deg, var(--button-from, rgb(var(--color-primary))), var(--button-to, rgb(var(--color-primary))))",
                      }
                    : {
                        backgroundColor: "rgba(255,255,255,.2)",
                        color: "rgb(var(--color-text))",
                        cursor: "not-allowed",
                      }
                }
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
