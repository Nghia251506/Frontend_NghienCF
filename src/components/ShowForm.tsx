// components/ShowForm.tsx
import React, { useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Upload,
  Space,
  Image,
  message,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axiosClient from "../axios/axiosClient";

export type ShowFormValues = {
  title: string;
  description: string;
  date: Date;
  location: string;
  bannerUrl: string;
  capacity: string;
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
      bannerUrl: values.bannerUrl ?? "",
      capacity: String(values.capacity),
      slogan: values.slogan,
    };

    await onSubmit(payload);
    form.resetFields();
    setBannerPreview(undefined);
  };

  // upload ảnh
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    // BE nhận "File" (chữ F hoa)
    formData.append("File", file);

    try {
      setUploading(true);

      // axiosClient đã có baseURL = https://api.chamkhoanhkhac.com/api
      const res = await axiosClient.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 👇 axiosClient đã unwrap -> res chính là { url, fileName, size }
      const url =
        (res as any).url ||
        (res as any).data?.url ||
        (typeof res === "string" ? res : "");

      if (!url) {
        message.error("Upload không trả về URL (check lại BE hoặc axios interceptor)");
        console.log("upload response = ", res);
        return;
      }

      form.setFieldsValue({ bannerUrl: url });
      setBannerPreview(url);
      message.success("Tải ảnh thành công!");
    } catch (err: any) {
      console.error("Upload failed", err);
      message.error(
        err?.response?.data?.message || "Upload ảnh thất bại. Kiểm tra lại /uploads"
      );
    } finally {
      setUploading(false);
    }

    // chặn antd upload
    return false;
  };

  const handleRemoveImage = () => {
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

      <Form.Item label="Ảnh bìa" name="bannerUrl">
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
                    void handleUpload(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    Đổi ảnh
                  </Button>
                </Upload>
                <Button danger icon={<DeleteOutlined />} onClick={handleRemoveImage}>
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
              <Input
                placeholder="Hoặc dán URL ảnh..."
                onChange={(e) => {
                  const val = e.target.value;
                  form.setFieldsValue({ bannerUrl: val });
                  setBannerPreview(val || undefined);
                }}
              />
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
        <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
          {submitText ?? "Lưu"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ShowForm;
