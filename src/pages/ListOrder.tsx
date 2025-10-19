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
  Grid,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import { RootState, AppDispatch } from "../redux/store";
import { fetchBookings } from "../redux/BookingSlice";
import type { Booking } from "../types/Booking";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 10;
const POLL_MS = 6000; // poll 6s/lần để phát hiện order mới

type Row = Booking & {
  _showTitle?: string;
  _ticketTypeName?: string;
  _ticketColor?: string;
};

const ListOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const screens = useBreakpoint();
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

        newOnes.forEach((b) => seen.add(b.id));
      } catch {
        /* im lặng nếu lỗi tạm thời */
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

  const rows: Row[] = useMemo(() => {
    return filteredData.map((b) => ({
      ...b,
      _showTitle: b.show?.title ?? b.showTitle ?? "",
      _ticketTypeName: b.ticketType?.name ?? b.ticketTypeName ?? "",
      _ticketColor: b.ticketType?.color ?? b.ticketTypeColor ?? "",
    }));
  }, [filteredData]);

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
      /* lỗi đã hiển thị ở FormItem */
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

  // ========== Columns (responsive)
  const columns: ColumnsType<Row> = useMemo(
    () => [
      // Cột gộp cho mobile
      {
        title: "Thông tin",
        dataIndex: "info",
        responsive: ["xs"],
        render: (_: any, b: Row, index) => (
          <div className="min-w-[280px]">
            <div className="flex items-center justify-between">
              <Text strong>#{b.id} • {b.customerName}</Text>
              <span className="text-[12px] text-gray-400">{dayjs(b.createdAt ?? b.paymentTime).format("DD/MM HH:mm")}</span>
            </div>

            <div className="mt-1 grid grid-cols-1 gap-1 text-[13px] text-gray-300">
              <div>
                <span className="text-gray-400">SĐT:</span>{" "}
                <b>{b.phone || "-"}</b>
              </div>
              <div className="truncate">
                <span className="text-gray-400">Show:</span>{" "}
                <span title={b.show?.title || "-"}>{b.show?.title || "-"}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-400">Loại vé:</span>{" "}
                <b>{b._ticketTypeName || "-"}</b>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Màu:</span>
                {b._ticketColor ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      style={{
                        width: 12, height: 12, borderRadius: 999,
                        border: "1px solid #ddd",
                        background:
                          /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(b._ticketColor.toLowerCase()) ||
                          /(rgb|hsl)/i.test(b._ticketColor)
                            ? b.ticketType?.color
                            : ({ red: "#ef4444", gold: "#f59e0b", silver: "#c0c0c0" } as any)[b._ticketColor.toLowerCase()] ||
                              b._ticketColor || "#999",
                      }}
                    />
                    <code>{b._ticketColor}</code>
                  </span>
                ) : (
                  <span>-</span>
                )}
              </div>
              <div>
                <span className="text-gray-400">SL:</span>{" "}
                <b>{b.quantity}</b>
                <span className="ml-3 text-gray-400">Tổng:</span>{" "}
                <b>{toVnd(b.totalAmount)}</b>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Trạng thái:</span> {statusTag(b.paymentStatus)}
              </div>
              <div>
                <span className="text-gray-400">Thanh toán lúc:</span>{" "}
                {b.paymentTime ? dayjs(b.paymentTime).format("DD/MM/YYYY HH:mm") : <span className="text-gray-500">-</span>}
              </div>
            </div>
          </div>
        ),
      },

      // Các cột chi tiết (desktop từ md)
      {
        title: "STT",
        dataIndex: "stt",
        width: 80,
        align: "center",
        responsive: ["md"],
        render: (_: any, __: Row, index: number) =>
          (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      { title: "Tên khách", dataIndex: "customerName", ellipsis: true, responsive: ["md"] },
      {
        title: "Số điện thoại",
        dataIndex: "phone",
        width: 150,
        responsive: ["md"],
        render: (v: string) => v || "-",
      },
      {
        title: "Show",
        dataIndex: "showTitle",
        width: 200,
        align: "center",
        responsive: ["md"],
        render: (_: any, b) => b.show?.title || "-",
      },
      {
        title: "Loại vé",
        dataIndex: "ticketTypeName",
        width: 160,
        align: "center",
        responsive: ["md"],
        render: (_: any, b) => b.ticketType?.name || "-",
      },
      {
        title: "Màu vé",
        dataIndex: "ticketTypeColor",
        width: 150,
        align: "center",
        responsive: ["lg"],
        render: (_: any, b) => {
          const color = (b.ticketType?.color || "").toLowerCase();
          return b.ticketType?.color ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  background:
                    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) || /(rgb|hsl)/i.test(color)
                      ? color
                      : ({ red: "#ef4444", gold: "#f59e0b", silver: "#c0c0c0" } as any)[color] ||
                        color || "#999",
                }}
              />
              <span>{b.ticketType.color}</span>
            </span>
          ) : (
            "-"
          );
        },
      },
      { title: "Số lượng", dataIndex: "quantity", width: 110, align: "center", responsive: ["md"] },
      {
        title: "Tổng tiền",
        dataIndex: "totalAmount",
        width: 170,
        responsive: ["md"],
        render: (v: number) => <span className="font-medium">{toVnd(v)}</span>,
      },
      {
        title: "Trạng thái",
        dataIndex: "paymentStatus",
        width: 130,
        responsive: ["md"],
        render: (v: string) => statusTag(v),
      },
      {
        title: "Thanh toán lúc",
        dataIndex: "paymentTime",
        width: 200,
        responsive: ["md"],
        render: (v: Date) =>
          v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <span className="text-gray-400">-</span>,
      },
    ],
    [currentPage]
  );

  const handleTableChange = (p: TablePaginationConfig) => {
    setCurrentPage(p.current ?? 1);
  };

  return (
    <div className="w-full">
      <Card
        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg"
        bodyStyle={{ padding: 16 }}
        title={<Title level={3} className="!mb-0 !text-white">📦 Danh sách Order</Title>}
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

        <div className="w-full overflow-x-auto">
          <Table<Row>
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            onChange={handleTableChange}
            pagination={{ current: currentPage, pageSize: PAGE_SIZE, showSizeChanger: false }}
            bordered
            size={screens.md ? "middle" : "small"}
            className="min-w-[780px] md:min-w-0 rounded-xl"
            scroll={{ x: 780 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ListOrder;
