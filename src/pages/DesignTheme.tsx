// src/pages/DesignTheme.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Form, Input, Button, Space, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";

import {
  fetchTheme as fetchActiveTheme,
  fetchThemeList,
  createThemeThunk,
  updateThemeThunk,
} from "../redux/ThemeSlice";
import { fetchShows } from "../redux/ShowSlice";

import type { ThemeDto } from "../types/theme";
import { defaultTheme } from "../types/theme";
import { toast } from "react-toastify";

/* ----------------------- helpers ----------------------- */
const hexToRgb = (hex: string) => {
  if (!hex) return "0 0 0";
  const s = hex.replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(v, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

// Chuẩn hoá object từ API -> ThemeDto
const toThemeDto = (api: any | null | undefined): ThemeDto => {
  const pick = (obj: any, ...keys: string[]) =>
    keys.map((k) => obj?.[k]).find((v) => typeof v === "string" && v.trim().length) as
      | string
      | undefined;

  if (!api) return { ...defaultTheme };

  return {
    primaryColor:
      pick(api, "primaryColor", "primary", "PrimaryColor", "Primary") ??
      defaultTheme.primaryColor,
    accent: pick(api, "accent", "Accent") ?? defaultTheme.accent,
    background: pick(api, "background", "Background") ?? defaultTheme.background,
    surface: pick(api, "surface", "Surface") ?? defaultTheme.surface,
    text: pick(api, "text", "Text") ?? defaultTheme.text,
    muted: pick(api, "muted", "Muted") ?? defaultTheme.muted,
    navbar: pick(api, "navbar", "Navbar") ?? defaultTheme.navbar,
    buttonFrom: pick(api, "buttonFrom", "ButtonFrom") ?? defaultTheme.buttonFrom,
    buttonTo: pick(api, "buttonTo", "ButtonTo") ?? defaultTheme.buttonTo,
    scrollbarThumb:
      pick(api, "scrollbarThumb", "ScrollbarThumb") ?? defaultTheme.scrollbarThumb,
    scrollbarTrack:
      pick(api, "scrollbarTrack", "ScrollbarTrack") ?? defaultTheme.scrollbarTrack,
  };
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

  // CSS scrollbar cho iframe
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

/* Một hàng chọn màu (input text + color) */
const ColorRow: React.FC<{ name: keyof ThemeDto; label: string; form: any }> = ({
  name,
  label,
  form,
}) => {
  const value = Form.useWatch(name as string, form) as string | undefined;
  return (
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
          value={value || "#000000"}
          onChange={(e) => form.setFieldsValue({ [name]: e.target.value })}
        />
      </div>
    </Form.Item>
  );
};

/* ----------------------- Component ----------------------- */
const DesignTheme: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // dữ liệu global
  const shows = useSelector((s: RootState) => s.shows.items);
  const themeList = useSelector((s: RootState) => s.theme.list); // tất cả theme
  const activeTheme = useSelector((s: RootState) => s.theme.current); // theme FE đang dùng

  // show đang chọn
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  const [form] = Form.useForm<ThemeDto>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // nạp dữ liệu ban đầu
  useEffect(() => {
    dispatch(fetchShows());
    dispatch(fetchThemeList());
    dispatch(fetchActiveTheme());
  }, [dispatch]);

  // lấy theme của show (nếu có)
  const showThemeRaw = useMemo(() => {
    if (selectedShowId == null) return null;
    return themeList.find((t) => t.showId === selectedShowId) ?? null;
  }, [themeList, selectedShowId]);

  // điền form + cập nhật preview khi đổi show / danh sách theme / theme active
  useEffect(() => {
    const dto = showThemeRaw
      ? toThemeDto(showThemeRaw)
      : activeTheme
      ? toThemeDto(activeTheme)
      : toThemeDto(null);

    form.resetFields();
    form.setFieldsValue(dto);

    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, dto);
  }, [selectedShowId, showThemeRaw, activeTheme, form]);

  // khi iframe load lần đầu → apply với giá trị hiện tại trong form
  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    const dto = (form.getFieldsValue() as ThemeDto) || defaultTheme;
    if (doc) setIframeTheme(doc, dto);
  };

  // realtime: thay đổi form → đổi ngay trong iframe
  const onValuesChange = (_: any, all: ThemeDto) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, all);
  };

  // Lưu: có theme của show thì update, không thì create
  const onSave = async () => {
    if (selectedShowId == null) {
      toast.info("Vui lòng chọn Show trước khi lưu.");
      return;
    }
    const dto = (await form.validateFields()) as ThemeDto;

    try {
      if (showThemeRaw) {
        await dispatch(
          updateThemeThunk({ id: showThemeRaw.id, dto: { ...dto, showId: selectedShowId } })
        ).unwrap();
        toast.success(`Đã cập nhật theme cho show #${selectedShowId}`);
      } else {
        await dispatch(createThemeThunk({ ...dto, showId: selectedShowId })).unwrap();
        toast.success(`Đã tạo theme cho show #${selectedShowId}`);
      }
      // refresh list để đảm bảo state mới nhất
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
        {/* Chọn show theo ID */}
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
              value: s.id!,
              label: `#${s.id} — ${s.title}`,
            }))}
            allowClear
          />
          <p className="mt-2 text-xs text-gray-400">
            * Giá trị gửi lên server là <b>showId</b>. Nếu show chưa có theme, khi lưu sẽ tạo mới.
          </p>
        </div>

        <Form
          key={selectedShowId ?? "global"} // ép remount khi đổi show
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
            <Button type="primary" onClick={onSave}>
              Lưu
            </Button>
            {activeTheme && (
              <Button
                onClick={() => {
                  const dto = toThemeDto(activeTheme);
                  form.resetFields();
                  form.setFieldsValue(dto);
                  const doc = iframeRef.current?.contentDocument;
                  if (doc) setIframeTheme(doc, dto);
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
        {/* Nếu muốn ẩn header khi preview có thể dùng "/?embed=1" ở src */}
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
