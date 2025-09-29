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
      // 1) Chuẩn hóa date -> ISO có timezone địa phương (VD +07:00)
      const dateIso: string = dayjs(values.date).format("YYYY-MM-DDTHH:mm:ssZ");

      // 2) Upload ảnh (nếu có)
      let bannerUrl = "";
      if (fileList[0]?.originFileObj) {
        bannerUrl = await uploadImage(fileList[0].originFileObj as File);
      }

      // 3) Build payload đúng kiểu
      const payload: ShowCreateDto = {
        title: (values.title || "").trim(),
        description: (values.description || "").trim(),
        date: dateIso,                              // <-- string ISO
        location: (values.location || "").trim(),
        bannerUrl,                                  // <-- string
        capacity: Number(values.capacity) || 0,     // <-- number
        slogan: (values.slogan || "").trim(),
      };

      await dispatch(addShow(payload)).unwrap();
      toast.success("✅ Thêm show thành công!");
      form.resetFields();
      setFileList([]);
    } catch (err: any) {
      // In chi tiết lỗi từ backend để biết vì sao 400
      console.error("[AddShow] error:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title || // ModelState error mặc định
        "Thêm show thất bại!";
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <Card title="Thêm Show Diễn" className="w-full max-w-2xl shadow-lg rounded-xl">
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item label="Tên Show" name="title" rules={[{ required: true, message: "Vui lòng nhập tên show!" }]}>
            <Input placeholder="Nhập tên show..." />
          </Form.Item>

          <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
            <Input.TextArea rows={4} placeholder="Nhập mô tả show..." />
          </Form.Item>

          <Form.Item label="Ngày & giờ diễn" name="date" rules={[{ required: true, message: "Vui lòng chọn ngày giờ!" }]}>
            <DatePicker
              className="w-full"
              showTime={{ format: "HH:mm", minuteStep: 5 }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item label="Địa điểm" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}>
            <Input placeholder="Nhập địa điểm tổ chức..." />
          </Form.Item>

          <Form.Item label="Sức chứa (người)" name="capacity" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
            <InputNumber min={1} className="w-full" placeholder="Nhập sức chứa" />
          </Form.Item>

          <Form.Item label="Slogan / Khẩu hiệu" name="slogan">
            <Input placeholder="Ví dụ: Một đêm không thể quên!" />
          </Form.Item>

          {/* Ảnh bìa (upload) đưa xuống cuối như bạn muốn */}
          <Form.Item label="Ảnh bìa">
            <Upload
              fileList={fileList}
              beforeUpload={() => false} // ngăn antd upload tự động
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
