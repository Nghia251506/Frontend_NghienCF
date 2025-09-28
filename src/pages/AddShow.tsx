import React from "react";
import { Form, Input, DatePicker, InputNumber, Button, Card } from "antd";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import { addShow } from "../redux/ShowSlice";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const AddShow: React.FC = () => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.shows);

    const onFinish = async (values: any) => {
        try {
            // values.date là dayjs object (do DatePicker), ta convert về ISO 8601
            // Bạn đang ở GMT+7, nên nếu muốn "00:00 local" convert đúng sang ISO:
            const localYmd = dayjs(values.date).format("YYYY-MM-DD");
            const jsDate: Date = values.date.toDate();

            const payload = {
                title: values.title,
                description: values.description,
                date: jsDate,                 // ✅ ISO string
                location: values.location,
                bannerUrl: values.bannerUrl,
                capacity: String(values.capacity), // ✅ ép về string
                slogan: values.slogan,
            };
            await dispatch(addShow(payload)).unwrap();
            toast.success("✅ Thêm show thành công!");
            form.resetFields();
        } catch (error: any) {
            toast.error(error?.response?.data?.title || "Thêm show thất bại!");
        }
    };

    return (
        <div className="p-6 flex justify-center">
            <Card title="Thêm Show Diễn" className="w-full max-w-2xl shadow-lg rounded-xl">
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item label="Tên Show" name="title" rules={[{ required: true, message: "Vui lòng nhập tên show!" }]}>
                        <Input placeholder="Nhập tên show..." />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
                        <Input.TextArea rows={4} placeholder="Nhập mô tả show..." />
                    </Form.Item>

                    <Form.Item label="Ngày diễn" name="date" rules={[{ required: true, message: "Vui lòng chọn ngày diễn!" }]}>
                        <DatePicker
                            className="w-full"
                            showTime={{ format: "HH:mm", minuteStep: 5 }} // chọn cả giờ, phút
                            format="DD/MM/YYYY HH:mm"
                            // optional: chặn chọn ngày quá khứ
                            disabledDate={(current) => current && current < dayjs().startOf("day")}
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
                            Thêm Show
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AddShow;
