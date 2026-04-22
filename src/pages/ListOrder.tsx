import React, { useEffect, useMemo, useState } from "react";
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
  Popconfirm,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import { RootState, AppDispatch } from "../redux/store";
import { fetchBookings } from "../redux/BookingSlice";
import type { Booking } from "../types/Booking";
import axiosClient from "../axios/axiosClient";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 10;

type Row = Booking & {
  _showTitle?: string;
  _ticketTypeName?: string;
  _ticketColor?: string;
};

const ListOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const screens = useBreakpoint();
  const { items: bookings, loading } = useSelector(
    (s: RootState) => s.bookings,
  );

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [form] = Form.useForm();
  const [term, setTerm] = useState<string>("");

  // 🔥 Đã tắt hoàn toàn tính năng Polling (Tự động gọi API) để tiết kiệm tài nguyên Server
  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(fetchBookings()).unwrap();
      } catch (e: any) {
        toast.error(e || "Không tải được danh sách đơn hàng");
      }
    };
    init();
  }, [dispatch]);

  const toVnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number.isFinite(n) ? n : 0);

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
  const handleIssueTicket = async (record: Row) => {
    const paymentRef = record.bookingCode;

    if (!paymentRef) {
      toast.error(
        `Đơn #${record.id} bị thiếu mã BookingCode, không thể duyệt!`,
      );
      return;
    }

    try {
      // 1. Gọi API cập nhật trạng thái
      await axiosClient.post(
        `/booking/update-status/${paymentRef}?status=paid`,
      );
      const ticketUrl = `${window.location.origin}/ticket/${record.id}`;
      await navigator.clipboard.writeText(ticketUrl);
      toast.success(
        `🎉 Đã duyệt đơn #${record.id} và copy link vé thành công!`,
      );
      await dispatch(fetchBookings()).unwrap();
    } catch (error: any) {
      console.error("Issue Ticket Error:", error);
      toast.error(
        error.response?.data?.message || `Lỗi duyệt đơn #${record.id}`,
      );
    }
  };

  // ========== Columns (responsive)
  const columns: ColumnsType<Row> = useMemo(
    () => [
      // Cột gộp cho mobile
      {
        title: "Thông tin",
        dataIndex: "info",
        responsive: ["xs"],
        render: (_: any, b: Row) => {
          const currentStatus = (b.paymentStatus || "").toLowerCase();
          const canIssueTicket =
            currentStatus === "pending" || currentStatus === "failed";

          return (
            <div className="min-w-[280px]">
              <div className="flex items-center justify-between">
                <Text strong className="!text-white">
                  #{b.id} • {b.customerName}
                </Text>
                <span className="text-[12px] text-gray-400">
                  {dayjs(b.createdAt ?? b.paymentTime).format("DD/MM HH:mm")}
                </span>
              </div>

              <div className="mt-1 grid grid-cols-1 gap-1 text-[13px] text-gray-300">
                <div>
                  <span className="text-gray-400">SĐT:</span>{" "}
                  <b>{b.phone || "-"}</b>
                </div>
                <div className="truncate">
                  <span className="text-gray-400">Show:</span>{" "}
                  <span title={b.show?.title || "-"}>
                    {b.show?.title || "-"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-gray-400">Loại vé:</span>{" "}
                  <b>{b._ticketTypeName || "-"}</b>
                </div>
                <div>
                  <span className="text-gray-400">SL:</span> <b>{b.quantity}</b>{" "}
                  <span className="ml-3 text-gray-400">Tổng:</span>{" "}
                  <b>{toVnd(b.totalAmount)}</b>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Trạng thái:</span>{" "}
                  {statusTag(b.paymentStatus)}
                </div>
              </div>

              {/* 🔥 Nút hành động cho Mobile (Pending & Failed) */}
              {canIssueTicket && (
                <div className="mt-3">
                  <Popconfirm
                    title="Duyệt đơn và phát hành vé?"
                    description={`Xác nhận đã nhận đủ ${toVnd(b.totalAmount)} cho đơn #${b.id}?`}
                    onConfirm={() => handleIssueTicket(b)}
                    okText="Phát hành"
                    cancelText="Hủy"
                  >
                    <Button
                      type="primary"
                      size="small"
                      style={{
                        backgroundColor: "#f59e0b",
                        borderColor: "#f59e0b",
                        color: "#000",
                        fontWeight: "bold",
                      }}
                    >
                      Phát hành vé
                    </Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          );
        },
      },

      // Các cột chi tiết (desktop từ md)
      {
        title: "STT",
        width: 60,
        align: "center",
        responsive: ["md"],
        render: (_: any, __: Row, index: number) =>
          (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: "Tên khách",
        dataIndex: "customerName",
        ellipsis: true,
        responsive: ["md"],
      },
      {
        title: "SĐT",
        dataIndex: "phone",
        width: 120,
        responsive: ["md"],
        render: (v: string) => v || "-",
      },
      {
        title: "Show",
        dataIndex: "showTitle",
        width: 160,
        align: "center",
        ellipsis: true,
        responsive: ["md"],
        render: (_: any, b) => b.show?.title || "-",
      },
      {
        title: "Loại vé",
        dataIndex: "ticketTypeName",
        width: 120,
        align: "center",
        responsive: ["md"],
        render: (_: any, b) => b.ticketType?.name || "-",
      },
      {
        title: "SL",
        dataIndex: "quantity",
        width: 60,
        align: "center",
        responsive: ["md"],
      },
      {
        title: "Tổng tiền",
        dataIndex: "totalAmount",
        width: 120,
        responsive: ["md"],
        render: (v: number) => <span className="font-medium">{toVnd(v)}</span>,
      },
      {
        title: "Trạng thái",
        dataIndex: "paymentStatus",
        width: 100,
        align: "center",
        responsive: ["md"],
        render: (v: string) => statusTag(v),
      },

      // 🔥 Cột Hành động cho Desktop
      {
        title: "Hành động",
        key: "action",
        width: 120,
        align: "center",
        responsive: ["md"],
        render: (_: any, b: Row) => {
          const currentStatus = (b.paymentStatus || "").toLowerCase();

          // Hiển thị nút nếu là Pending hoặc Failed
          if (currentStatus === "pending" || currentStatus === "failed") {
            return (
              <Popconfirm
                title="Phát hành vé?"
                description={`Bạn đã nhận được ${toVnd(b.totalAmount)}?`}
                onConfirm={() => handleIssueTicket(b)}
                okText="Đồng ý"
                cancelText="Hủy"
                placement="left"
              >
                <Button
                  type="primary"
                  size="small"
                  style={{
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  Phát hành vé
                </Button>
              </Popconfirm>
            );
          }
          return null;
        },
      },
    ],
    [currentPage],
  );

  const handleTableChange = (p: TablePaginationConfig) =>
    setCurrentPage(p.current ?? 1);

  return (
    <div className="w-full">
      <Card
        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg"
        bodyStyle={{ padding: 16 }}
        title={
          <Title level={3} className="!mb-0 !text-white">
            📦 Danh sách Order
          </Title>
        }
      >
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
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              showSizeChanger: false,
            }}
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
