import React, { useEffect, useMemo, useState } from "react";
import { Card, Form, Input, Button, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchTheme, saveTheme } from "../redux/ThemeSlice";
import { applyTheme, ThemeDto } from "../utils/applyTheme";
import { toast } from "react-toastify";

const ColorField: React.FC<{ name: keyof ThemeDto; label: string; }> = ({ name, label }) => {
  return (
    <Form.Item name={name} label={label} rules={[{ required: true, message: "Nhập mã màu hex" }]}>
      <div className="flex gap-2">
        <Input placeholder="#RRGGBB" className="flex-1" />
        {/* input type=color cho tiện chọn */}
        <input
          type="color"
          onChange={(e) => {
            const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
            if (el) el.value = e.target.value;
            (document.activeElement as HTMLElement)?.blur();
          }}
          className="h-10 w-12 rounded-md cursor-pointer"
        />
      </div>
    </Form.Item>
  );
};

const DesignTheme: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.theme.current);
  const [form] = Form.useForm<ThemeDto>();
  const [live, setLive] = useState<ThemeDto | null>(null);

  useEffect(() => {
    if (!theme) dispatch(fetchTheme());
  }, [dispatch, theme]);

  useEffect(() => {
    if (theme) {
      form.setFieldsValue(theme);
      setLive(theme);
    }
  }, [theme, form]);

  // preview realtime: apply vào 1 container riêng (demo), và đồng thời cập nhật global để bạn thấy ngay
  const onValuesChange = (_: any, all: ThemeDto) => {
    setLive(all);
    applyTheme(all); // áp trực tiếp, nếu muốn chỉ preview cục bộ thì dùng iframe/khối riêng
  };

  const onSave = async () => {
    const dto = await form.validateFields();
    await dispatch(saveTheme(dto)).unwrap();
    toast.success("Đã lưu giao diện");
  };

  const gradientBtn = useMemo(() => ({
    backgroundImage: `linear-gradient(90deg, ${live?.ButtonFrom ?? '#f59e0b'}, ${live?.ButtonTo ?? '#f97316'})`
  }), [live]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cột trái: form chọn màu */}
      <Card title="Thiết lập màu sắc" className="rounded-2xl border border-white/10 bg-white/5 text-white">
        <Form<ThemeDto>
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
          initialValues={theme ?? {} as any}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorField name="Primary" label="Primary" />
            <ColorField name="Accent" label="Accent" />
            <ColorField name="Background" label="Background" />
            <ColorField name="Surface" label="Surface (card)" />
            <ColorField name="Text" label="Text" />
            <ColorField name="Muted" label="Muted" />
            <ColorField name="Navbar" label="Navbar" />
            <ColorField name="ButtonFrom" label="Button Gradient From" />
            <ColorField name="ButtonTo" label="Button Gradient To" />
            <ColorField name="ScrollbarThumb" label="Scrollbar Thumb" />
            <ColorField name="ScrollbarTrack" label="Scrollbar Track" />
          </div>

          <Space className="mt-4">
            <Button type="primary" onClick={onSave}>Lưu</Button>
            <Button onClick={() => theme && (form.setFieldsValue(theme), applyTheme(theme))}>
              Hoàn tác về đã lưu
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Cột phải: preview realtime */}
      <Card title="Preview realtime" className="rounded-2xl border border-white/10 bg-white/5 text-white">
        <div className="rounded-xl p-6" style={{
          background: live?.Background,
          color: live?.Text,
        }}>
          <nav className="rounded-lg px-4 py-3 mb-4" style={{ background: live?.Navbar }}>
            <span className="font-semibold">Navbar</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: live?.Surface }}>
              <h3 className="font-bold mb-2" style={{ color: live?.Text }}>Card Title</h3>
              <p className="text-sm" style={{ color: live?.Muted }}>
                Đây là mô tả ngắn mô phỏng nội dung…
              </p>
              <button
                className="mt-3 text-black font-semibold px-4 py-2 rounded-lg"
                style={gradientBtn}
              >
                Nút Primary
              </button>
            </div>

            <div className="rounded-xl p-4 h-40 overflow-y-auto"
                 style={{ background: live?.Surface }}>
              <p className="text-sm" style={{ color: live?.Muted }}>
                Scroll thử để xem màu scrollbar.
              </p>
              <div className="h-64" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DesignTheme;
