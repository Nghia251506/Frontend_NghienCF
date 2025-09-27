// components/ShowForm.tsx
import React from "react";
import { Form, Input, DatePicker, InputNumber, Button } from "antd";
import dayjs from "dayjs";

export type ShowFormValues = {
  title: string;
  description: string;
  date: Date;            // gửi Date để axios serialize ISO
  location: string;
  bannerUrl: string;
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

  const initDate = initial?.date ? dayjs(initial.date) : undefined;

  const handleFinish = async (values: any) => {
    const jsDate: Date = values.date?.toDate?.() ?? new Date();
    const payload: ShowFormValues = {
      title: values.title,
      description: values.description,
      date: jsDate,
      location: values.location,
      bannerUrl: values.bannerUrl,
      capacity: String(values.capacity),
      slogan: values.slogan,
    };
    await onSubmit(payload);
    form.resetFields();
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
      <Form.Item label="Tên Show" name="title" rules={[{ required: true, message: "Vui lòng nhập tên show!" }]}>
        <Input placeholder="Nhập tên show..." />
      </Form.Item>

      <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
        <Input.TextArea rows={4} placeholder="Nhập mô tả show..." />
      </Form.Item>

      <Form.Item label="Thời gian diễn" name="date" rules={[{ required: true, message: "Vui lòng chọn ngày & giờ!" }]}>
        <DatePicker
          className="w-full"
          showTime={{ format: "HH:mm", minuteStep: 5 }}
          format="DD/MM/YYYY HH:mm"
        />
      </Form.Item>

      <Form.Item label="Địa điểm" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}>
        <Input placeholder="Nhập địa điểm tổ chức..." />
      </Form.Item>

      <Form.Item label="Ảnh bìa (URL)" name="bannerUrl" rules={[{ required: true, message: "Vui lòng nhập link ảnh bìa!" }]}>
        <Input placeholder="https://example.com/banner.jpg" />
      </Form.Item>

      <Form.Item label="Sức chứa (người)" name="capacity" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
        <InputNumber min={1} className="w-full" placeholder="Nhập sức chứa" />
      </Form.Item>

      <Form.Item label="Slogan / Khẩu hiệu" name="slogan" rules={[{ required: true, message: "Vui lòng nhập slogan!" }]}>
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
