import React, { useState, useEffect } from "react";
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
// Import Service Appwrite của ông
import { AppwriteService } from "../../appwrite.config"; 

export type ShowFormValues = {
  title: string;
  description: string;
  date: Date;
  location: string;
  bannerUrl: string;
  totalSeats: number;
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

  // Cập nhật lại form khi initial thay đổi (Sửa lỗi không fill data)
  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        ...initial,
        date: initial.date ? dayjs(initial.date) : undefined,
        totalSeats: initial.totalSeats ? Number(initial.totalSeats) : undefined,
      });
      setBannerPreview(initial.bannerUrl);
    }
  }, [initial, form]);

  const handleFinish = async (values: any) => {
    const jsDate: Date = values.date?.toDate?.() ?? new Date();

    const payload: ShowFormValues = {
      title: values.title,
      description: values.description,
      date: jsDate,
      location: values.location,
      bannerUrl: values.bannerUrl ?? "",
      totalSeats: values.totalSeats,
      slogan: values.slogan,
    };

    await onSubmit(payload);
    // Sau khi submit thành công mới reset
    form.resetFields();
    setBannerPreview(undefined);
  };

  /**
   * Xử lý Upload qua Appwrite
   */
  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // 1. Nếu đang có ảnh cũ, có thể xóa trên Appwrite để dọn rác (Tùy chọn)
      if (bannerPreview) {
        await AppwriteService.deleteFileByUrl(bannerPreview);
      }

      // 2. Upload file mới lên Appwrite
      const url = await AppwriteService.uploadFile(file);

      // 3. Update vào Form và Preview
      form.setFieldsValue({ bannerUrl: url });
      setBannerPreview(url);
      message.success("Tải ảnh lên Appwrite thành công!");
    } catch (err: any) {
      console.error("Appwrite Upload failed", err);
      message.error("Không thể tải ảnh lên Appwrite. Kiểm tra cấu hình Bucket/Network.");
    } finally {
      setUploading(false);
    }
    return false; // Chặn hành vi upload mặc định của antd
  };

  /**
   * Xử lý Xóa ảnh
   */
  const handleRemoveImage = async () => {
    if (bannerPreview) {
      try {
        await AppwriteService.deleteFileByUrl(bannerPreview);
        form.setFieldsValue({ bannerUrl: "" });
        setBannerPreview(undefined);
        message.info("Đã xóa ảnh trên hệ thống lưu trữ.");
      } catch (error) {
        message.error("Lỗi khi xóa file.");
      }
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
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

      <Form.Item label="Ảnh bìa (Appwrite Storage)" name="bannerUrl">
        <Space direction="vertical" style={{ width: "100%" }}>
          {bannerPreview ? (
            <div className="relative group w-[240px]">
              <Image
                src={bannerPreview}
                alt="Banner"
                width={240}
                className="rounded-lg object-cover shadow-md"
                preview={true}
              />
              <div className="mt-2 flex gap-2">
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUpload}
                >
                  <Button icon={<UploadOutlined />} loading={uploading} size="small">
                    Thay ảnh khác
                  </Button>
                </Upload>
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={handleRemoveImage}
                  size="small"
                >
                  Gỡ bỏ
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Upload.Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
                className="bg-white/5 border-dashed"
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ color: 'rgb(var(--color-primary))' }} />
                </p>
                <p className="ant-upload-text text-gray-300">Nhấn hoặc kéo thả ảnh vào đây</p>
                {uploading && <p className="text-blue-400">Đang tải lên Appwrite...</p>}
              </Upload.Dragger>
              <Input
                placeholder="Hoặc dán trực tiếp URL ảnh..."
                onChange={(e) => {
                  const val = e.target.value;
                  form.setFieldsValue({ bannerUrl: val });
                  setBannerPreview(val || undefined);
                }}
              />
            </div>
          )}
        </Space>
      </Form.Item>

      <Form.Item
        label="Sức chứa (người)"
        name="totalSeats"
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

      <Form.Item className="mb-0 mt-6">
        <Button 
          type="primary" 
          htmlType="submit" 
          className="w-full h-11 font-bold rounded-lg" 
          loading={loading || uploading}
          style={{
            backgroundImage: "linear-gradient(90deg, rgb(var(--color-primary)) 0%, color-mix(in srgb, rgb(var(--color-primary)) 80%, white) 100%)",
            border: 'none',
            color: '#000'
          }}
        >
          {submitText ?? "Lưu Show"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ShowForm;