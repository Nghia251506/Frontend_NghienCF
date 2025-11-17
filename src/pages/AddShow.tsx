import React, { useMemo, useState } from "react";
import { Form, Input, DatePicker, InputNumber, Button, Card, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import { addShow } from "../redux/ShowSlice";
import { uploadImage } from "../service/UploadService";
import type { ShowCreateDto } from "../types/Show";

const { TextArea } = Input;

const AddShow: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.shows);

  const [fileList, setFileList] = useState<any[]>([]);

  const bannerPreview = useMemo(() => {
    const f = fileList[0]?.originFileObj as File | undefined;
    return f ? URL.createObjectURL(f) : undefined;
  }, [fileList]);

  const onFinish = async (values: any) => {
    try {
      // 1) Chuẩn hoá ngày giờ -> ISO (an toàn cho ASP.NET)
      const dateIso = dayjs(values.date).format("YYYY-MM-DDTHH:mm:ssZ");

      // 2) Upload ảnh nếu có -> nhận về URL
      let bannerUrl: string | undefined;
      if (fileList[0]?.originFileObj) {
        const url = await uploadImage(fileList[0].originFileObj as File);
        if (typeof url !== "string" || !url.trim()) {
          throw new Error("Upload ảnh thất bại hoặc trả về URL không hợp lệ.");
        }
        bannerUrl = url.trim();
      }

      // 3) Payload
      const payload: Partial<ShowCreateDto> = {
        title: (values.title || "").trim(),
        description: (values.description || "").trim(),
        date: dateIso,
        location: (values.location || "").trim(),
        totalSeats: values.totalSeats,
        slogan: (values.slogan || "").trim(),
        ...(bannerUrl ? { bannerUrl } : {}),
      };

      await dispatch(addShow(payload as ShowCreateDto)).unwrap();
      toast.success("✅ Thêm show thành công!");
      form.resetFields();
      setFileList([]);
    } catch (err: any) {
      const resp = err?.response?.data;
      const detail =
        (resp?.errors && JSON.stringify(resp.errors)) ||
        resp?.message ||
        resp?.title ||
        err?.message ||
        "Thêm show thất bại!";
      toast.error(detail);
      
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6">
      {/* Card full-width desktop, gọn ở mobile */}
      <Card
        title={<div className="text-base sm:text-lg font-semibold !text-gray-200">Thêm Show Diễn</div>}
        className="w-full shadow-lg rounded-2xl border border-white/10 bg-white/5 text-white"
        styles={{ body: { padding: 16 } }}
      >
        {/* Grid responsive: 2 cột từ md trở lên */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
          {/* Cột trái */}
          <div className="space-y-4 md:space-y-6">
            <Form.Item
              label={<span className="text-gray-200">Tên Show</span>}
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập tên show!" }]}
            >
              <Input size="large" placeholder="Nhập tên show..." />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-200">Ngày & giờ diễn</span>}
              name="date"
              rules={[{ required: true, message: "Vui lòng chọn ngày giờ!" }]}
              tooltip="Chọn ngày và giờ bắt đầu show"
            >
              <DatePicker
                className="w-full"
                size="large"
                showTime={{ format: "HH:mm", minuteStep: 5 }}
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-200">Địa điểm</span>}
              name="location"
              rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}
              tooltip="Ví dụ: Nghiền Cafe, 123 Lê Lợi, Q.1, TP.HCM"
            >
              <Input size="large" placeholder="Nhập địa điểm tổ chức..." />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-200">Sức chứa (người)</span>}
              name="totalSeats"
              rules={[
                { required: true, message: "Vui lòng nhập sức chứa!" },
                { type: "number", min: 1, message: "Sức chứa phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                className="w-full"
                size="large"
                placeholder="VD: 150"
                controls={false}
              />
            </Form.Item>
          </div>

          {/* Cột phải */}
          <div className="space-y-4 md:space-y-6">
            <Form.Item label={<span className="text-gray-200">Slogan / Khẩu hiệu</span>} name="slogan">
              <Input size="large" placeholder="Ví dụ: Một đêm không thể quên!" />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-200">Mô tả</span>}
              name="description"
              rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
            >
              <TextArea rows={6} placeholder="Nhập mô tả show..." />
            </Form.Item>

            <Form.Item label={<span className="text-gray-200">Ảnh bìa</span>} valuePropName="fileList">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}  // không upload tự động
                  maxCount={1}
                  onChange={({ fileList }) => setFileList(fileList)}
                  accept="upload/*"
                >
                  <Button icon={<UploadOutlined />} size="large">
                    Chọn ảnh
                  </Button>
                </Upload>

                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-28 w-full sm:w-40 object-cover rounded-lg border border-white/10"
                  />
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                JPG/PNG/WebP • &lt; 2MB • Tỷ lệ khung nên 16:9 để hiển thị đẹp.
              </div>
            </Form.Item>
          </div>

          {/* Hàng hành động */}
          <div className="md:col-span-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full md:w-auto"
              loading={loading}
            >
              Thêm Show
            </Button>
          </div>
        </Form>
      </Card>

      {/* Khoảng cách đáy trên mobile */}
      <div className="h-6" />
    </div>
  );
};

export default AddShow;
