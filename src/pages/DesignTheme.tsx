// src/pages/DesignTheme.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Form, Input, Button, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchTheme, saveTheme } from "../redux/ThemeSlice";
import { ThemeDto } from "../applyTheme"; // type bạn đã có
import { toast } from "react-toastify";

// utils
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

  // đảm bảo scrollbar css tồn tại trong iframe
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
  <Form.Item name={name} label={label} rules={[{ required: true, message: "Nhập màu #RRGGBB" }]} className="mb-3">
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
  const theme = useSelector((s: RootState) => s.theme.current);
  const [form] = Form.useForm<ThemeDto>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // nạp theme hiện tại
  useEffect(() => {
    if (!theme) dispatch(fetchTheme());
  }, [dispatch, theme]);

  useEffect(() => {
    if (theme) form.setFieldsValue(theme);
  }, [theme, form]);

  // áp theme vào iframe khi iframe load lần đầu
  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && theme) setIframeTheme(doc, theme);
  };

  // realtime: đổi form → đổi trong iframe ngay
  const onValuesChange = (_: any, all: ThemeDto) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) setIframeTheme(doc, all);
  };

  const onSave = async () => {
    const dto = await form.validateFields();
    await dispatch(saveTheme(dto)).unwrap();
    toast.success("Đã lưu giao diện");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Cột trái: form */}
      <Card title="Thiết lập màu sắc" className="rounded-2xl border border-white/10 bg-white/5 text-white">
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
            {theme && (
              <Button onClick={() => { form.setFieldsValue(theme); const doc = iframeRef.current?.contentDocument; if (doc) setIframeTheme(doc, theme); }}>
                Hoàn tác về đã lưu
              </Button>
            )}
          </Space>
        </Form>
      </Card>

      {/* Cột phải: PREVIEW = layout client thật */}
      <Card title="Preview realtime (layout thật)" className="rounded-2xl border border-white/10 bg-white/5 text-white">
        {/* trỏ đến route bạn muốn xem thử; nếu muốn ẩn header khi preview dùng /?embed=1 */}
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
