// src/pages/TicketAdmin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchShows } from "../redux/ShowSlice";

import {
  Table,
  Input,
  DatePicker,
  Select,
  Space,
  Button,
  Tag,
  Switch,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import { getAllTickets, updateTicket } from "../service/TicketService";

// Kiểu dữ liệu hàng (backend nên trả về kèm thông tin booking)
type TicketRow = {
  id: number;
  bookingId: number;
  ticketCode: string;
  status: "valid" | "used" | string;
  issuedAt: string;         // ISO
  customerName?: string;    // từ booking
  phone?: string;           // từ booking
  paymentTime?: string;     // từ booking
  showId?: number;          // để lọc theo show
};

type Paged<T> = { items: T[]; total: number };

const { RangePicker } = DatePicker;
const { Option } = Select;

const TicketAdmin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // shows cho bộ lọc
  const shows = useSelector((s: RootState) => s.shows.items);
  const [showId, setShowId] = useState<number | undefined>(undefined);

  // bộ lọc
  const [ticketCode, setTicketCode] = useState<string>("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // bảng
  const [data, setData] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
  });

  // load shows 1 lần
  useEffect(() => {
    dispatch(fetchShows());
  }, [dispatch]);

  // query builder
  const queryParams = useMemo(() => {
    const params: any = {
      showId,
      ticketCode: ticketCode?.trim() || undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (range && range[0] && range[1]) {
      params.dateFrom = range[0].startOf("day").toISOString();
      params.dateTo = range[1].endOf("day").toISOString();
    }
    return params;
  }, [showId, ticketCode, range, pagination.current, pagination.pageSize]);

  // fetch data
  const loadTickets = async () => {
    setLoading(true);
    try {
      // BE có thể trả: TicketRow[] hoặc { items: TicketRow[], total: number }
      const res = (await getAllTickets(queryParams)) as TicketRow[] | Paged<TicketRow>;
      const items = Array.isArray(res) ? res : res.items;
      const total = Array.isArray(res) ? items.length : res.total;

      setData(items);
      setPagination((p) => ({ ...p, total: total ?? items.length }));
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.message || "Tải danh sách vé thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  // debounce tìm kiếm theo ticket code (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination((p) => ({ ...p, current: 1 })); // quay về trang 1 khi đổi code
      loadTickets();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketCode]);

  const onTableChange = (p: TablePaginationConfig) => {
    setPagination(p);
  };

  const handleResetFilters = () => {
    setShowId(undefined);
    setTicketCode("");
    setRange(null);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleMarkUsed = async (record: TicketRow) => {
    if (record.status === "used") {
      message.info("Vé này đã được check-in trước đó.");
      return;
    }
    try {
      await updateTicket(record.id, { status: "used" });
      message.success(`Đã cập nhật vé ${record.ticketCode} → used`);
      // cập nhật local ngay để phản hồi nhanh
      setData((prev) =>
        prev.map((t) => (t.id === record.id ? { ...t, status: "used" } : t))
      );
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.message || "Cập nhật trạng thái vé thất bại");
    }
  };

  const columns: ColumnsType<TicketRow> = [
    {
      title: "STT",
      dataIndex: "stt",
      width: 80,
      align: "center",
      render: (_, __, index) =>
        ((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1,
    },
    {
      title: "Tên khách đặt",
      dataIndex: "customerName",
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      width: 140,
      render: (v: string) => v || "-",
    },
    {
      title: "TicketCode",
      dataIndex: "ticketCode",
      width: 180,
      render: (v: string) => <Tag color="gold">{v}</Tag>,
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "paymentTime",
      width: 200,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (v: TicketRow["status"]) =>
        v === "used" ? <Tag color="purple">used</Tag> : <Tag color="green">valid</Tag>,
    },
    {
      title: "Check-in",
      dataIndex: "check",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Switch
          checked={record.status === "used"}
          checkedChildren="Used"
          unCheckedChildren="Valid"
          onChange={() => handleMarkUsed(record)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý vé đã phát hành</h2>

      {/* Toolbar filters */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo TicketCode"
          style={{ width: 240 }}
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
        />

        <RangePicker
          value={range as any}
          onChange={(v) => setRange(v as any)}
          placeholder={["Từ ngày", "Đến ngày"]}
          format={"DD/MM/YYYY"}
        />

        <Select
          allowClear
          placeholder="Lọc theo Show"
          style={{ width: 220 }}
          value={showId}
          onChange={(v) => setShowId(v)}
          options={shows.map((s) => ({ value: s.id, label: s.title }))}
        />

        <Button icon={<ReloadOutlined />} onClick={loadTickets}>
          Làm mới
        </Button>
        <Button onClick={handleResetFilters}>Xoá bộ lọc</Button>
      </Space>

      {/* Table */}
      <Table<TicketRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={pagination}
        onChange={onTableChange}
        bordered
      />
    </div>
  );
};

export default TicketAdmin;
