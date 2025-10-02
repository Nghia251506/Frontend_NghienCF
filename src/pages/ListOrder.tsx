// src/pages/ListOrder.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Tag,
  Space,
  Typography,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import { RootState, AppDispatch } from "../redux/store";
import { fetchBookings } from "../redux/BookingSlice";
import type { Booking } from "../types/Booking";

const { Title } = Typography;

const PAGE_SIZE = 10;
const POLL_MS = 6000; // poll 6s/lần để phát hiện order mới

const ListOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: bookings, loading } = useSelector((s: RootState) => s.bookings);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [form] = Form.useForm();
  const [term, setTerm] = useState<string>("");

  // Lưu danh sách id đã thấy để tránh toast trùng
  const seenIdsRef = useRef<Set<number>>(new Set());
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const first = await dispatch(fetchBookings()).unwrap();
        // seed tập id đã thấy
        const s = new Set<number>();
        first?.forEach((b: Booking) => s.add(b.id));
        seenIdsRef.current = s;
      } catch (e: any) {
        toast.error(e || "Không tải được danh sách đơn hàng");
      }
    };
    init();

    // Polling phát hiện order mới
    pollingRef.current = window.setInterval(async () => {
      try {
        const latest: Booking[] = await dispatch(fetchBookings()).unwrap();
        const seen = seenIdsRef.current;
        const newOnes = latest.filter((b) => !seen.has(b.id));

        if (newOnes.length === 1) {
          const b = newOnes[0];
          toast.success(
            `🆕 Đơn mới #${b.id} - ${b.customerName} (${b.phone}), SL: ${b.quantity}, Tổng: ${toVnd(
              b.totalAmount
            )}`
          );
        } else if (newOnes.length > 1) {
          toast.success(`🆕 Có ${newOnes.length} đơn hàng mới!`);
        }

        // cập nhật tập id đã thấy
        newOnes.forEach((b) => seen.add(b.id));
      } catch (e) {
        // im lặng nếu lỗi tạm thời
      }
    }, POLL_MS);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [dispatch]);

  const toVnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number.isFinite(n) ? n : 0
    );

  const sanitizeDigits = (s: string) => (s || "").replace(/\D+/g, "");

  const filteredData = useMemo(() => {
    if (!term?.trim()) return bookings;
    const q = term.trim().toLowerCase();
    const qDigits = sanitizeDigits(q);
    return bookings.filter((b) => {
      const name = (b.customerName || "").toLowerCase();
      const phoneDigits = sanitizeDigits(b.phone || "");
      if (qDigits.length >= 8) return phoneDigits.includes(qDigits);
      return name.includes(q);
    });
  }, [term, bookings]);

  // Validate input tìm kiếm
  const validateQuery = (_: any, value: string) => {
    const v = (value || "").trim();
    if (!v) return Promise.reject("Vui lòng nhập tên hoặc số điện thoại");
    const onlyPhoneChars = /^[\d\s+.\-]+$/.test(v);
    if (onlyPhoneChars) {
      const digits = sanitizeDigits(v);
      if (digits.length < 8) {
        return Promise.reject("SĐT phải có ít nhất 8 chữ số");
      }
      return Promise.resolve();
    }
    if (v.length < 2) return Promise.reject("Tên khách tối thiểu 2 ký tự");
    return Promise.resolve();
  };

  const onSearch = async () => {
    try {
      const { q } = await form.validateFields();
      setTerm(q);
      setCurrentPage(1);
      toast.info("Đang lọc kết quả…");
    } catch {
      // lỗi đã hiển thị ở FormItem
    }
  };

  const onRefresh = async () => {
    setTerm("");
    form.resetFields();
    setCurrentPage(1);
    try {
      await dispatch(fetchBookings()).unwrap();
      toast.success("Đã tải lại danh sách đơn hàng");
    } catch (e: any) {
      toast.error(e || "Tải lại thất bại");
    }
  };

  const statusTag = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return <Tag color="green">paid</Tag>;
    if (s === "failed") return <Tag color="red">failed</Tag>;
    return <Tag color="blue">pending</Tag>;
  };

  const columns: ColumnsType<Booking> = [
    {
      title: "STT",
      dataIndex: "stt",
      width: 80,
      align: "center",
      render: (_: any, __: Booking, index: number) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    { title: "Tên khách", dataIndex: "customerName", ellipsis: true },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 150,
      render: (v: string) => v || "-",
    },
    { title: "Show", dataIndex: "title", width: 100, align: "center" },
    { title: "Loại vé", dataIndex: "name", width: 100, align: "center" },
    { title: "Màu vé", dataIndex: "color", width: 100, align: "center" },
    { title: "Số lượng", dataIndex: "quantity", width: 100, align: "center" },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      width: 160,
      render: (v: number) => <span className="font-medium">{toVnd(v)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "paymentStatus",
      width: 130,
      render: (v: string) => statusTag(v),
    },
    {
      title: "Thanh toán lúc",
      dataIndex: "paymentTime",
      width: 190,
      render: (v: Date) =>
        v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <span className="text-gray-400">-</span>,
    },
  ];

  const handleTableChange = (p: TablePaginationConfig) => {
    setCurrentPage(p.current ?? 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-8">
      <Card
        className="w-full rounded-2xl shadow-lg mx-auto"
        bodyStyle={{ padding: 24 }}
        title={<Title level={3} className="!mb-0">📦 Danh sách Order</Title>}
      >
        {/* Search */}
        <Form
          form={form}
          layout="inline"
          onFinish={onSearch}
          className="mb-6 flex flex-wrap gap-3"
        >
          <Form.Item
            name="q"
            className="flex-1 min-w-[260px]"
            rules={[{ validator: validateQuery }]}
          >
            <Input
              allowClear
              size="large"
              placeholder="Nhập tên khách hoặc số điện thoại..."
              onPressEnter={onSearch}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={onSearch}
              >
                Tìm
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={onRefresh}
              >
                Làm mới
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table<Booking>
          rowKey="id"
          loading={loading}
          dataSource={filteredData}
          columns={columns}
          onChange={handleTableChange}
          pagination={{ current: currentPage, pageSize: PAGE_SIZE, showSizeChanger: false }}
          bordered
          size="middle"
          className="w-full rounded-xl shadow-sm"
        />
      </Card>
    </div>
  );
};

export default ListOrder;
