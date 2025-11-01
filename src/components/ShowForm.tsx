// components/ShowForm.tsx
import React, { useState } from "react";
import { Form, Input, DatePicker, InputNumber, Button, Upload, Space, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axiosClient from "../axios/axiosClient";

export type ShowFormValues = {
  title: string;
  description: string;
  date: Date;            // gửi Date để axios serialize ISO
  location: string;
  bannerUrl: string;     // giữ nguyên để BE nhận
  capacity: string;      // backend muốn string
  slogan: string;
};

type Props = {
  initial?: Partial<ShowFormValues>;
  loading?: boolean;
  onSubmit: (values: ShowFormValues) => Promise<void> | void;
  submitText?: string;
};

const ShowForm: React.FC<Props> = ({ initial, loading, onSubmit, submitText }) => {
  const [form] = Form.useForm();

  // state để hiển thị preview ảnh
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(
    initial?.bannerUrl && initial.bannerUrl.trim() !== "" ? initial.bannerUrl : undefined
  );
  const [uploading, setUploading] = useState(false);

  const initDate = initial?.date ? dayjs(initial.date) : undefined;

  const handleFinish = async (values: any) => {
    const jsDate: Date = values.date?.toDate?.() ?? new Date();

    const payload: ShowFormValues = {
      title: values.title,
      description: values.description,
      date: jsDate,
      location: values.location,
      // ⚠️ ở đây lấy từ form, đã được set khi upload
      bannerUrl: values.bannerUrl ?? "",
      capacity: String(values.capacity),
      slogan: values.slogan,
    };

    await onSubmit(payload);
    // nếu form này dùng cho "sửa" thì thường không reset,
    // nhưng bạn đang reset nên mình giữ nguyên
    form.resetFields();
    setBannerPreview(undefined);
  };

  // upload ảnh lên BE
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axiosClient.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const url = res.data?.url as string;
      // set vào form
      form.setFieldsValue({ bannerUrl: url });
      setBannerPreview(url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    // gửi xuống BE là "" để nó xoá ảnh
    form.setFieldsValue({ bannerUrl: "" });
    setBannerPreview(undefined);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initial,
        date: initDate,
        capacity: initial?.capacity ? Number(initial.capacity) : undefined,
      }}
      onFinish={handleFinish}
    >
      <Form.Item
        label="Tên Show"
        name="title"
        rules={[{ required: true, message: "Vui lòng nhập tên show!" }]}
      >
        <Input placeholder="Nhập tên show..." />
      </Form.Item>

      <Form.Item
        label="Mô tả"
        name="description"
        rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
      >
        <Input.TextArea rows={4} placeholder="Nhập mô tả show..." />
      </Form.Item>

      <Form.Item
        label="Thời gian diễn"
        name="date"
        rules={[{ required: true, message: "Vui lòng chọn ngày & giờ!" }]}
      >
        <DatePicker
          className="w-full"
          showTime={{ format: "HH:mm", minuteStep: 5 }}
          format="DD/MM/YYYY HH:mm"
        />
      </Form.Item>

      <Form.Item
        label="Địa điểm"
        name="location"
        rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}
      >
        <Input placeholder="Nhập địa điểm tổ chức..." />
      </Form.Item>

      {/* ---- ẢNH BÌA ---- */}
      <Form.Item
        label="Ảnh bìa"
        name="bannerUrl"
        rules={[{ required: false }]} // sửa: không bắt buộc, vì bạn có upload
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {bannerPreview ? (
            <>
              <Image
                src={bannerPreview}
                alt="Banner"
                width={240}
                style={{ borderRadius: 8 }}
                preview={false}
              />
              <Space>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    // tự upload
                    void handleUpload(file);
                    // chặn antd upload mặc định
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    Đổi ảnh
                  </Button>
                </Upload>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveImage}
                >
                  Bỏ ảnh
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                    void handleUpload(file);
                    return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Chọn ảnh & tải lên
                </Button>
              </Upload>
              <Input placeholder="Hoặc dán URL ảnh..." onChange={(e) => {
                const val = e.target.value;
                form.setFieldsValue({ bannerUrl: val });
                setBannerPreview(val || undefined);
              }} />
            </>
          )}
        </Space>
      </Form.Item>

      <Form.Item
        label="Sức chứa (người)"
        name="capacity"
        rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}
      >
        <InputNumber min={1} className="w-full" placeholder="Nhập sức chứa" />
      </Form.Item>

      <Form.Item
        label="Slogan / Khẩu hiệu"
        name="slogan"
        rules={[{ required: true, message: "Vui lòng nhập slogan!" }]}
      >
        <Input placeholder="Ví dụ: Một đêm không thể quên!" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="w-full"
          loading={loading}
        >
          {submitText ?? "Lưu"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ShowForm;
