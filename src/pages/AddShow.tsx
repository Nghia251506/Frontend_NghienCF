// src/pages/AddShow.tsx
import React, { useState } from "react";
import { Form, Input, DatePicker, InputNumber, Button, Card, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import { addShow } from "../redux/ShowSlice";
import { uploadImage } from "../service/UploadService";
import type { ShowCreateDto } from "../types/Show";

const AddShow: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.shows);

  const [fileList, setFileList] = useState<any[]>([]);

  const onFinish = async (values: any) => {
    try {
      // 1) Chuẩn hoá ngày giờ -> ISO (an toàn cho ASP.NET)
      // Antd DatePicker trả về Dayjs; dùng toDate().toISOString()
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

      // 3) Tạo payload đúng kiểu; KHÔNG gửi bannerUrl nếu không có
      const payload: Partial<ShowCreateDto> = {
        title: (values.title || "").trim(),
        description: (values.description || "").trim(),
        date: dateIso, // string ISO
        location: (values.location || "").trim(),
        capacity: values.capacity || "",
        slogan: (values.slogan || "").trim(),
        ...(bannerUrl ? { bannerUrl } : {}),
      };

      console.log("[AddShow] payload gửi:", payload);

      await dispatch(addShow(payload as ShowCreateDto)).unwrap();
      toast.success("✅ Thêm show thành công!");

      form.resetFields();
      setFileList([]);
    } catch (err: any) {
      // In chi tiết lỗi từ backend để xác định vì sao 400
      const resp = err?.response?.data;
      console.error("[AddShow] error:", resp || err);

      // Ưu tiên hiện ModelState errors, sau đó message/title
      const detail =
        (resp?.errors && JSON.stringify(resp.errors)) ||
        resp?.message ||
        resp?.title ||
        "Thêm show thất bại!";

      toast.error(detail);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <Card
        title="Thêm Show Diễn"
        className="w-full max-w-2xl shadow-lg rounded-xl"
        styles={{ body: { padding: 16 } }} // dùng styles thay cho bodyStyle (antd deprecate)
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
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
            label="Ngày & giờ diễn"
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày giờ!" }]}
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

          <Form.Item
            label="Sức chứa (người)"
            name="capacity"
            rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}
          >
            <Input className="w-full" placeholder="Nhập sức chứa" />
          </Form.Item>

          <Form.Item label="Slogan / Khẩu hiệu" name="slogan">
            <Input placeholder="Ví dụ: Một đêm không thể quên!" />
          </Form.Item>

          {/* Ảnh bìa (tùy chọn). 
              Nếu server bắt buộc ảnh, thêm rules={[{ required: true, message: "Vui lòng chọn ảnh bìa!" }]} */}
          <Form.Item label="Ảnh bìa" valuePropName="fileList">
            <Upload
              fileList={fileList}
              beforeUpload={() => false} // không upload tự động
              maxCount={1}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
              Thêm Show
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddShow;
