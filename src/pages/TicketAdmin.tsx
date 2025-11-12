// src/pages/TicketAdmin.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchShows } from "../redux/ShowSlice";
import { fetchTicketTypes } from "../redux/TicketTypeSlice";
import { Modal } from "antd";
import html2canvas from "html2canvas";
import type { Show } from "../types/Show";

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
  Card,
  Typography,
  Grid,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { TicketType } from "../types/TicketType";

import { getAllTickets, updateTicket } from "../service/TicketService";


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
  ticketType?: TicketType;
};

type Paged<T> = { items: T[]; total: number };

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const TicketAdmin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const screens = useBreakpoint();

  // shows cho bộ lọc
  const shows = useSelector((s: RootState) => s.shows.items);
  const [showId, setShowId] = useState<number | undefined>(undefined);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);

  const openReissue = (row: TicketRow) => {
    setSelectedTicket(row);
    setReissueOpen(true);
  };
  const closeReissue = () => {
    setReissueOpen(false);
    setSelectedTicket(null);
  };

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
  const types = useSelector((s: RootState) => s.ticketTypes.items);
  // load shows 1 lần
  useEffect(() => {
    dispatch(fetchShows());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchTicketTypes());
  }, [dispatch])

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
      const res = (await getAllTickets(queryParams)) as TicketRow[] | Paged<TicketRow>;
      const items = Array.isArray(res) ? res : res.items;
      const total = Array.isArray(res) ? items.length : res.total;
      setData(items);
      setPagination((p) => ({ ...p, total: total ?? items.length }));
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      message.error(e?.response?.data?.message || "Tải danh sách vé thất bại");
    } finally {
      setLoading(false);
    }
  };

  // load khi đổi query
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  // debounce tìm theo ticketCode (300ms)
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPagination((p) => ({ ...p, current: 1 }));
      loadTickets();
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
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
      setData((prev) =>
        prev.map((t) => (t.id === record.id ? { ...t, status: "used" } : t))
      );
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      message.error(e?.response?.data?.message || "Cập nhật trạng thái vé thất bại");
    }
  };

  const toDateTime = (v?: string) =>
    v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-";

  // ========== Columns responsive
  const columns: ColumnsType<TicketRow> = useMemo(
    () => [
      // Gộp cho mobile
      {
        title: "Thông tin",
        dataIndex: "info",
        responsive: ["xs"],
        render: (_: any, r) => (
          <div className="min-w-[280px]">
            <div className="flex items-center justify-between">
              <Text strong>#{r.id} • {r.customerName || "-"}</Text>
              <span className="text-[12px] text-gray-400">{toDateTime(r.paymentTime)}</span>
            </div>

            <div className="mt-1 grid grid-cols-1 gap-1 text-[13px] text-gray-300">
              <div>
                <span className="text-gray-400">Ticket:</span>{" "}
                <Tag color="gold" className="m-0">{r.ticketCode}</Tag>
              </div>
              <div>
                <span className="text-gray-400">SĐT:</span>{" "}
                <b>{r.phone || "-"}</b>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Trạng thái:</span>{" "}
                {r.status === "used" ? <Tag color="purple">used</Tag> : <Tag color="green">valid</Tag>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Check-in:</span>
                <Switch
                  checked={r.status === "used"}
                  checkedChildren="Used"
                  unCheckedChildren="Valid"
                  onChange={() => handleMarkUsed(r)}
                />
              </div>
            </div>
          </div>
        ),
      },

      // Chi tiết từ md trở lên
      {
        title: "STT",
        dataIndex: "stt",
        width: 80,
        align: "center",
        responsive: ["md"],
        render: (_, __, index) =>
          ((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1,
      },
      {
        title: "Tên khách đặt",
        dataIndex: "customerName",
        ellipsis: true,
        responsive: ["md"],
        render: (v: string) => v || "-",
      },
      {
        title: "SĐT",
        dataIndex: "phone",
        width: 140,
        responsive: ["md"],
        render: (v: string) => v || "-",
      },
      {
        title: "TicketCode",
        dataIndex: "ticketCode",
        width: 180,
        responsive: ["md"],
        render: (v: string) => <Tag color="gold">{v}</Tag>,
      },
      {
        title: "Loại combo",
        dataIndex: "ticketType",
        width: 200,
        responsive: ["md"],
        render: (_: any, r) => (
          <Tag color={r.ticketType?.color || "default"} className="m-0">
            {r.ticketType?.name ?? "-"}
          </Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 120,
        align: "center",
        responsive: ["md"],
        render: (v: TicketRow["status"]) =>
          v === "used" ? <Tag color="purple">used</Tag> : <Tag color="green">valid</Tag>,
      },
      {
        title: "Check-in",
        dataIndex: "check",
        width: 140,
        align: "center",
        responsive: ["md"],
        render: (_, record) => (
          <Switch
            checked={record.status === "used"}
            checkedChildren="Used"
            unCheckedChildren="Valid"
            onChange={() => handleMarkUsed(record)}
          />
        ),
      },
      {
        title: "Cấp lại vé",
        dataIndex: "actions",
        width: 140,
        align: "center",
        render: (_: any, record) => (
          <Button
            size="small"
            type="primary"
            onClick={() => openReissue(record)}
            disabled={record.status !== "valid"} // chỉ cho vé hợp lệ/đã thanh toán
          >
            Cấp lại
          </Button>
        ),
      },
    ],
    [pagination.current, pagination.pageSize]
  );
  const TicketPreview: React.FC<{ ticket: TicketRow; show?: Show }> = ({ ticket, show }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const color = ticket.ticketType?.color || "#f59e0b"; // fallback vàng
    const bg = show?.bannerUrl || ticket.ticketType?.color;
    const dateText =
      (show?.date && dayjs(show.date).format("DD/MM/YYYY HH:mm")) ||
      (ticket.paymentTime && dayjs(ticket.paymentTime).format("DD/MM/YYYY HH:mm")) ||
      (ticket.issuedAt && dayjs(ticket.issuedAt).format("DD/MM/YYYY HH:mm")) ||
      "Đang cập nhật";

    const handleDownload = async () => {
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: window.devicePixelRatio || 2,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket-${ticket.ticketCode.replace(/[#\s]/g, "")}-reissue.png`;
      a.click();
    };

    return (
      <div className="flex flex-col items-center">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl shadow-2xl w-[360px]"
          style={{ background: bg, border: `1px solid ${color}55` }}
        >
          <div className="relative z-10 p-6">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold" >
                {ticket.ticketType?.name?.toUpperCase() || "TICKET"}
              </h1>
              <p className="text-black text-sm">Re-issued Ticket</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: "#00000040", border: `1px solid ${color}33` }}>
                <p className="!text-white text-sm">Tên khách hàng</p>
                <p className="text-white font-semibold text-base">{ticket.customerName || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: "#00000040", border: `1px solid ${color}33` }}>
                  <p className="!text-white text-sm">Mã vé</p>
                  <p className="text-white font-semibold">{ticket.ticketCode}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "#00000040", border: `1px solid ${color}33` }}>
                  <p className="!text-white text-sm">Trạng thái</p>
                  <p className="text-white font-semibold">{ticket.status}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: "#00000040", border: `1px solid ${color}33` }}>
                <p className="!text-white text-sm">Thời gian</p>
                <p className="text-white font-semibold">{dateText}</p>
              </div>

              <div className="p-3 rounded-lg" style={{ background: "#00000040", border: `1px solid ${color}33` }}>
                <p className="!text-white text-sm">Địa điểm</p>
                <p className="text-white font-semibold">{show?.location || "-"}</p>
              </div>
            </div>

            <div className="text-center mt-4">
              <div className="w-full h-8 rounded-full mb-2 flex items-center justify-center" style={{ background: `${color}33` }}>
                <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: color }} />
              </div>
            </div>
          </div>
        </div>

        <Button className="mt-3" type="primary" onClick={handleDownload}>
          Tải ảnh vé
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card
        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg"
        bodyStyle={{ padding: 16 }}
        title={<Title level={3} className="!mb-0 !text-white">🎟️ Quản lý vé đã phát hành</Title>}
      >
        {/* Toolbar filters */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Tìm theo TicketCode"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                size="large"
              />
            </div>

            <div className="flex-1 min-w-[260px]">
              <RangePicker
                value={range as any}
                onChange={(v) => setRange(v as any)}
                placeholder={["Từ ngày", "Đến ngày"]}
                format={"DD/MM/YYYY"}
                className="w-full"
                size="large"
              />
            </div>

            <div className="flex-1 min-w-[220px]">
              <Select
                allowClear
                placeholder="Lọc theo Show"
                value={showId}
                onChange={(v) => setShowId(v)}
                options={shows.map((s) => ({ value: s.id, label: s.title }))}
                className="w-full"
                size="large"
              />
            </div>

            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={loadTickets} size="large">
                Làm mới
              </Button>
              <Button onClick={handleResetFilters} size="large">
                Xoá bộ lọc
              </Button>
            </Space>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <Table<TicketRow>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={pagination}
            onChange={onTableChange}
            bordered
            size={screens.md ? "middle" : "small"}
            className="min-w-[760px] md:min-w-0 rounded-xl"
            scroll={{ x: 760 }}
          />
          <Modal
            open={reissueOpen}
            onCancel={closeReissue}
            footer={null}
            width={420}
            title="Cấp lại vé"
            destroyOnClose
          >
            {selectedTicket && (
              <TicketPreview
                ticket={selectedTicket}
                show={shows.find((s) => s.id === selectedTicket.showId)}
              />
            )}
          </Modal>
        </div>
      </Card>
    </div>
  );
};

export default TicketAdmin;
