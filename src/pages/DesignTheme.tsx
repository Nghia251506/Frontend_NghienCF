// src/pages/DesignTheme.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Form, Input, Button, Space, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchShows } from "../redux/ShowSlice";
import {
  fetchTheme as fetchActiveTheme,
  fetchThemeList,
  createThemeThunk,
  updateThemeThunk,
} from "../redux/ThemeSlice";
import { toast } from "react-toastify";
import type { ThemeDto } from "../types/theme";
import { defaultTheme } from "../types/theme";

/* ---------- utils ---------- */
const hexToRgb = (hex: string) => {
  if (!hex) return "0 0 0";
  const s = hex.replace("#", "");
  const v = s.length === 3 ? s.split("").map(c => c + c).join("") : s;
  const n = parseInt(v, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const setIframeTheme = (doc: Document, dto: ThemeDto) => {
  const root = doc.documentElement;
  root.style.setProperty("--color-primary", hexToRgb(dto.primaryColor));
  root.style.setProperty("--color-accent", hexToRgb(dto.accent));
  root.style.setProperty("--color-bg", hexToRgb(dto.background));
  root.style.setProperty("--color-surface", hexToRgb(dto.surface));
  root.style.setProperty("--color-text", hexToRgb(dto.text));
  root.style.setProperty("--color-muted", hexToRgb(dto.muted));
  root.style.setProperty("--color-navbar", hexToRgb(dto.navbar));
  root.style.setProperty("--scrollbar-thumb", dto.scrollbarThumb);
  root.style.setProperty("--scrollbar-track", dto.scrollbarTrack);

  // đảm bảo css scrollbar trong iframe
  const id = "theme-scrollbar";
  let style = doc.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = id;
    doc.head.appendChild(style);
  }
  style.textContent = `
    *::-webkit-scrollbar{width:10px;height:10px}
    *::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:9999px}
    *::-webkit-scrollbar-track{background:var(--scrollbar-track)}
    *{scrollbar-color:var(--scrollbar-thumb) var(--scrollbar-track);scrollbar-width:thin}
  `;
};

const ColorRow: React.FC<{ name: keyof ThemeDto; label: string; form: any }> = ({
  name,
  label,
  form,
}) => (
  <Form.Item
    name={name}
    label={label}
    rules={[{ required: true, message: "Nhập màu #RRGGBB" }]}
    className="mb-3"
  >
    <div className="flex gap-2">
      <Input placeholder="#RRGGBB" className="flex-1" />
      <input
        type="color"
        className="h-10 w-12 rounded-md cursor-pointer"
        onChange={(e) => form.setFieldsValue({ [name]: e.target.value })}
      />
    </div>
  </Form.Item>
);

/* ---------- component ---------- */
const DesignTheme: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<ThemeDto>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // store
  const { items: shows, loading: loadingShows } = useSelector((s: RootState) => s.shows);
  const { list: themeList, current: activeTheme, loading: loadingTheme } = useSelector(
    (s: RootState) => s.theme
  );

  // show đang chọn (value = showId)
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // load dữ liệu
  useEffect(() => {
    dispatch(fetchShows());
    dispatch(fetchThemeList());
    dispatch(fetchActiveTheme());
  }, [dispatch]);

  // auto chọn show đầu tiên khi shows sẵn sàng
  useEffect(() => {
    if (!loadingShows && shows.length > 0 && selectedShowId == null) {
      setSelectedShowId(shows[0].id!);
    }
  }, [loadingShows, shows, selectedShowId]);

  // theme riêng của show (nếu có)
  const showTheme = useMemo(() => {
    if (selectedShowId == null) return null;
    return themeList.find((t) => t.showId === selectedShowId) ?? null;
  }, [themeList, selectedShowId]);

  // Điền form MỖI KHI đã xác định show + dữ liệu đã sẵn sàng
  useEffect(() => {
    if (selectedShowId == null) return;
    if (loadingShows || loadingTheme) return;

    // Ưu tiên theme của show → fallback theme active/global → fallback defaultTheme
    const base: ThemeDto = {
      ...defaultTheme,
      ...(activeTheme ?? {}),
      ...(showTheme ?? {}),
    };

    // ĐẢM BẢO KHỚP KEY VỚI Form.Item
    const values: ThemeDto = {
      primaryColor: base.primaryColor,
      accent: base.accent,
      background: base.background,
      surface: base.surface,
      text: base.text,
      muted: base.muted,
      navbar: base.navbar,
      buttonFrom: base.buttonFrom ?? defaultTheme.buttonFrom,
      buttonTo: base.buttonTo ?? defaultTheme.buttonTo,
      scrollbarThumb: base.scrollbarThumb,
      scrollbarTrack: base.scrollbarTrack,
    };

    form.resetFields();            // clear state cũ (tránh field giữ giá trị)
    form.setFieldsValue(values);   // set giá trị mới

    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, values);
  }, [selectedShowId, showTheme, activeTheme, loadingShows, loadingTheme, form]);

  // khởi tạo theme cho iframe ngay khi load
  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    const dto = form.getFieldsValue() as ThemeDto;
    if (doc && dto && dto.primaryColor) setIframeTheme(doc, dto);
  };

  // realtime thay đổi
  const onValuesChange = (_: any, all: ThemeDto) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, all);
  };

  // Lưu
  const onSave = async () => {
    if (selectedShowId == null) {
      toast.info("Vui lòng chọn Show trước khi lưu.");
      return;
    }
    const dto = (await form.validateFields()) as ThemeDto;

    try {
      if (showTheme) {
        await dispatch(
          updateThemeThunk({ id: showTheme.id, dto: { ...dto, showId: selectedShowId } })
        ).unwrap();
        toast.success(`Đã cập nhật theme cho show #${selectedShowId}`);
      } else {
        await dispatch(createThemeThunk({ ...dto, showId: selectedShowId })).unwrap();
        toast.success(`Đã tạo theme cho show #${selectedShowId}`);
      }
      await dispatch(fetchThemeList());
    } catch (e: any) {
      toast.error(e?.message || "Lưu theme thất bại");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Cột trái: Form */}
      <Card
        title="Thiết lập màu sắc theo Show"
        className="rounded-2xl border border-white/10 bg-white/5 text-white"
      >
        <div className="mb-4">
          <label className="block mb-2 text-sm text-gray-300">Chọn Show (theo ID)</label>
          <Select
            placeholder="Chọn show theo ID"
            className="w-full"
            showSearch
            optionFilterProp="label"
            value={selectedShowId ?? undefined}
            onChange={(v) => setSelectedShowId(v ?? null)}
            options={shows.map((s) => ({ value: s.id!, label: `#${s.id} — ${s.title}` }))}
            allowClear
          />
          <p className="mt-2 text-xs text-gray-400">
            * Gửi lên server là <b>showId</b>. Nếu show chưa có theme, khi lưu sẽ tạo mới.
          </p>
        </div>

        <Form
          key={`form-${selectedShowId ?? "none"}`}   // ép Form “fresh” khi đổi show
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorRow name="primaryColor" label="Primary" form={form} />
            <ColorRow name="accent" label="Accent" form={form} />
            <ColorRow name="background" label="Background" form={form} />
            <ColorRow name="surface" label="Surface (card)" form={form} />
            <ColorRow name="text" label="Text" form={form} />
            <ColorRow name="muted" label="Muted" form={form} />
            <ColorRow name="navbar" label="Navbar" form={form} />
            <ColorRow name="scrollbarThumb" label="Scrollbar Thumb" form={form} />
            <ColorRow name="scrollbarTrack" label="Scrollbar Track" form={form} />
          </div>

          <Space className="mt-4">
            <Button type="primary" onClick={onSave}>Lưu</Button>
            {activeTheme && (
              <Button
                onClick={() => {
                  const merged = { ...defaultTheme, ...activeTheme };
                  form.resetFields();
                  form.setFieldsValue(merged);
                  const doc = iframeRef.current?.contentDocument;
                  if (doc) setIframeTheme(doc, merged);
                }}
              >
                Hoàn tác về theme global
              </Button>
            )}
          </Space>
        </Form>
      </Card>

      {/* Cột phải: Preview = layout thật */}
      <Card
        title="Preview realtime (layout thật)"
        className="rounded-2xl border border-white/10 bg-white/5 text-white"
      >
        <iframe
          ref={iframeRef}
          src="/"
          onLoad={handleIframeLoad}
          className="w-full h-[720px] rounded-xl border border-white/10 bg-black"
        />
      </Card>
    </div>
  );
};

export default DesignTheme;
