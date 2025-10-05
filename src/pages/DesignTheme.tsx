// src/pages/DesignTheme.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Form, Input, Button, Space, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";

import { fetchTheme as fetchActiveTheme, fetchThemeList, createThemeThunk, updateThemeThunk } from "../redux/ThemeSlice";
import { fetchShows } from "../redux/ShowSlice";

import type { ThemeDto } from "../types/theme";
import { defaultTheme } from "../types/theme";
import { toast } from "react-toastify";

// ===== utils
const hexToRgb = (hex: string) => {
  if (!hex) return "0 0 0";
  const s = hex.replace("#", "");
  const v = s.length === 3 ? s.split("").map(c => c + c).join("") : s;
  const n = parseInt(v, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const setIframeTheme = (doc: Document, dto: ThemeDto) => {
  const root = doc.documentElement;
  root.style.setProperty("--color-primary", hexToRgb(dto.primary));
  root.style.setProperty("--color-accent", hexToRgb(dto.accent));
  root.style.setProperty("--color-bg", hexToRgb(dto.background));
  root.style.setProperty("--color-surface", hexToRgb(dto.surface));
  root.style.setProperty("--color-text", hexToRgb(dto.text));
  root.style.setProperty("--color-muted", hexToRgb(dto.muted));
  root.style.setProperty("--color-navbar", hexToRgb(dto.navbar));
  root.style.setProperty("--scrollbar-thumb", dto.scrollbarThumb);
  root.style.setProperty("--scrollbar-track", dto.scrollbarTrack);

  // đảm bảo CSS scrollbar có trong iframe
  const styleId = "theme-scrollbar";
  let style = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = styleId;
    doc.head.appendChild(style);
  }
  style.textContent = `
    *::-webkit-scrollbar{width:10px;height:10px}
    *::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:9999px}
    *::-webkit-scrollbar-track{background:var(--scrollbar-track)}
    *{scrollbar-color:var(--scrollbar-thumb) var(--scrollbar-track);scrollbar-width:thin}
  `;
};

const ColorRow: React.FC<{ name: keyof ThemeDto; label: string; form: any }> = ({ name, label, form }) => (
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

const DesignTheme: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // shows + themes list
  const shows = useSelector((s: RootState) => s.shows.items);
  const themeList = useSelector((s: RootState) => s.theme.list);
  const activeTheme = useSelector((s: RootState) => s.theme.current);

  // show đang chọn (value = showId)
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  const [form] = Form.useForm<ThemeDto>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // nạp dữ liệu: shows + danh sách themes + theme active (global cho FE)
  useEffect(() => {
    dispatch(fetchShows());
    dispatch(fetchThemeList());
    dispatch(fetchActiveTheme()); // để có theme global nếu cần fallback
  }, [dispatch]);

  // theme của show đang chọn (chỉ lấy đúng bản ghi showId, không fallback)
  const showTheme = useMemo(() => {
    if (selectedShowId == null) return null;
    return themeList.find(t => t.showId === selectedShowId) ?? null;
  }, [themeList, selectedShowId]);

  // điền form khi chọn show
  useEffect(() => {
    // ưu tiên theme riêng của show → nếu không có thì lấy theme global → nếu chưa có nữa thì defaultTheme
    const base: ThemeDto =
      showTheme
        ? {
            primary: showTheme.primary,
            accent: showTheme.accent,
            background: showTheme.background,
            surface: showTheme.surface,
            text: showTheme.text,
            muted: showTheme.muted,
            navbar: showTheme.navbar,
            buttonFrom: showTheme.buttonFrom,
            buttonTo: showTheme.buttonTo,
            scrollbarThumb: showTheme.scrollbarThumb,
            scrollbarTrack: showTheme.scrollbarTrack,
          }
        : activeTheme ?? defaultTheme;

    form.setFieldsValue(base);

    // update preview ngay
    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, base);
  }, [selectedShowId, showTheme, activeTheme, form]);

  // áp theme vào iframe khi iframe load lần đầu
  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    const dto = form.getFieldsValue() as ThemeDto;
    if (doc && dto) setIframeTheme(doc, dto);
  };

  // realtime: đổi form → đổi trong iframe ngay
  const onValuesChange = (_: any, all: ThemeDto) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, all);
  };

  // Lưu: nếu show có theme → update; nếu chưa → create (gắn showId đã chọn)
  const onSave = async () => {
    if (selectedShowId == null) {
      toast.info("Vui lòng chọn Show trước khi lưu.");
      return;
    }
    const dto = await form.validateFields();

    try {
      if (showTheme) {
        await dispatch(
          updateThemeThunk({ id: showTheme.id, dto: { ...dto, showId: selectedShowId } })
        ).unwrap();
        toast.success(`Đã cập nhật theme cho show #${selectedShowId}`);
      } else {
        await dispatch(
          createThemeThunk({ ...dto, showId: selectedShowId })
        ).unwrap();
        toast.success(`Đã tạo theme cho show #${selectedShowId}`);
      }

      // refresh list để đồng bộ state
      await dispatch(fetchThemeList());
    } catch (e: any) {
      toast.error(e?.message || "Lưu theme thất bại");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Cột trái: form */}
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
            options={shows.map((s) => ({
              value: s.id!,                        // value = showId (yêu cầu)
              label: `#${s.id} — ${s.title}`,      // hiển thị gợi nhớ
            }))}
            allowClear
          />
          <p className="mt-2 text-xs text-gray-400">
            * Giá trị gửi lên server là <b>showId</b>. Nếu show chưa có theme, khi lưu sẽ tạo mới.
          </p>
        </div>

        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorRow name="primary" label="Primary" form={form} />
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
                  // hoàn tác về theme global (hoặc bạn có thể hoàn tác về theme show nếu đang có)
                  form.setFieldsValue(activeTheme);
                  const doc = iframeRef.current?.contentDocument;
                  if (doc) setIframeTheme(doc, activeTheme);
                }}
              >
                Hoàn tác về theme global
              </Button>
            )}
          </Space>
        </Form>
      </Card>

      {/* Cột phải: PREVIEW = layout client thật */}
      <Card
        title="Preview realtime (layout thật)"
        className="rounded-2xl border border-white/10 bg-white/5 text-white"
      >
        {/* Nếu muốn ẩn header khi preview dùng "/?embed=1" */}
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