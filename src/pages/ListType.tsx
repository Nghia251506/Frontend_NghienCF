import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ColumnsType } from "antd/es/table";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Typography,
  Select,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

import { RootState, AppDispatch } from "../redux/store";
import {
  fetchTicketTypes,
  addTicketType,
  editTicketType,
  removeTicketType,
} from "../redux/TicketTypeSlice";
import { fetchShows } from "../redux/ShowSlice";
import { fetchBookings } from "../redux/BookingSlice";

import type { TicketType } from "../types/TicketType";
import type { Show } from "../types/Show";
import type { Booking } from "../types/Booking";

const { Title } = Typography;
const PAGE_SIZE = 10;

type TypeRow = TicketType & { remainingQuantity?: number };

const ListType: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Slices
  const {
    items: types,
    loading,
    creating,
    updating,
    removingId,
  } = useSelector((s: RootState) => s.ticketTypes);
  const shows = useSelector((s: RootState) => s.shows.items);
  const bookings = useSelector((s: RootState) => s.bookings.items);

  // UI state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // Modals & forms
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    // load dữ liệu
    dispatch(fetchShows()).unwrap().catch((e: any) => {
      toast.error(e || "Không tải được danh sách show");
    });
    dispatch(fetchTicketTypes()).unwrap().catch((e: any) => {
      toast.error(e || "Không tải được danh sách loại vé");
    });
    dispatch(fetchBookings()).unwrap().catch(() => {
      /* im lặng nếu lỗi tạm thời */
    });
  }, [dispatch]);

  // Map showId -> title
  const showTitleMap = useMemo(() => {
    const m = new Map<number, string>();
    (shows as Show[]).forEach((s) => s.id != null && m.set(s.id, s.title));
    return m;
  }, [shows]);

  // Options cho Select Show
  const showOptions = useMemo(
    () =>
      (shows as Show[]).map((s) => ({
        label: s.title,
        value: s.id!,
      })),
    [shows]
  );

  // Tổng số vé đã đặt theo (showId, ticketTypeId), loại trừ failed
  const bookedByType = useMemo(() => {
    const m = new Map<string, number>();
    (bookings as Booking[]).forEach((b) => {
      const status = (b.paymentStatus || "").toLowerCase();
      if (status === "failed") return; // không tính đơn failed
      const key = `${b.showId}-${b.ticketTypeId}`;
      m.set(key, (m.get(key) ?? 0) + (b.quantity ?? 0));
    });
    return m;
  }, [bookings]);

  const getBookedFor = (showId?: number, ticketTypeId?: number) => {
    if (!showId || !ticketTypeId) return 0;
    return bookedByType.get(`${showId}-${ticketTypeId}`) ?? 0;
  };

  // Lọc theo show đang chọn + tính remainingQuantity cho từng dòng
  const dataSource: TypeRow[] = useMemo(() => {
    const list = selectedShowId
      ? types.filter((t) => t.showId === selectedShowId)
      : types;

    return list.map((t) => {
      const booked = getBookedFor(t.showId, t.id);
      const remaining = Math.max(0, (t.totalQuantity ?? 0) - booked);
      return { ...t, remainingQuantity: remaining };
    });
  }, [types, selectedShowId, bookedByType]);

  // ==== Columns
  const toVnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);

  const columns: ColumnsType<TypeRow> = useMemo(
    () => [
      {
        title: "STT",
        dataIndex: "stt",
        width: 80,
        align: "center",
        render: (_: any, __: TypeRow, index: number) =>
          (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: "Show",
        dataIndex: "showId",
        width: 240,
        render: (id: number) => (
          <Space>
            <Tag color="gold">#{id}</Tag>
            <span>{showTitleMap.get(id) ?? "Không rõ"}</span>
          </Space>
        ),
      },
      {
        title: "Tên loại vé",
        dataIndex: "name",
        ellipsis: true,
      },
      {
        title: "Màu",
        dataIndex: "color",
        width: 140,
        render: (c: string) => (
          <Space>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 9999,
                background: c || "#ccc",
                border: "1px solid #ddd",
              }}
            />
            <code>{c || "-"}</code>
          </Space>
        ),
      },
      {
        title: "Giá",
        dataIndex: "price",
        width: 160,
        render: (v: number) => <span className="font-medium">{toVnd(v)}</span>,
      },
      {
        title: "Phát hành",
        dataIndex: "totalQuantity",
        width: 120,
        align: "center",
      },
      {
        title: "Còn lại",
        dataIndex: "remainingQuantity",
        width: 120,
        align: "center",
        render: (_: any, r: TypeRow) => (
          <span style={{ color: r.remainingQuantity === 0 ? "#f5222d" : undefined, fontWeight: 600 }}>
            {r.remainingQuantity}
          </span>
        ),
      },
      {
        title: "Hành động",
        dataIndex: "actions",
        width: 170,
        render: (_: any, record: TypeRow) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditing(record);
                setOpenEdit(true);
                // seed form edit (showId ẩn = show đang chọn hoặc của record)
                editForm.setFieldsValue({
                  showId: selectedShowId ?? record.showId,
                  name: record.name,
                  color: record.color,
                  price: record.price,
                  totalQuantity: record.totalQuantity,
                });
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xoá loại vé này?"
              okText="Xoá"
              cancelText="Huỷ"
              onConfirm={async () => {
                try {
                  await dispatch(removeTicketType(record.id!)).unwrap();
                  toast.success("Đã xoá loại vé");
                } catch (e: any) {
                  toast.error(e || "Xoá thất bại");
                }
              }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                loading={removingId === record.id}
              >
                Xoá
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [currentPage, showTitleMap, selectedShowId, editForm, dispatch, removingId]
  );

  const handleTableChange = (p: any) => {
    setCurrentPage(p.current ?? 1);
  };

  // ======= Add
  const onOpenAdd = () => {
    if (!selectedShowId) {
      toast.info("Vui lòng chọn Show trước khi thêm loại vé");
      return;
    }
    setOpenAdd(true);
    addForm.resetFields();
    addForm.setFieldsValue({ showId: selectedShowId });
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      await dispatch(addTicketType(values)).unwrap();
      toast.success("Đã thêm loại vé");
      setOpenAdd(false);
      addForm.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return; // validation error
      toast.error(e || "Thêm thất bại");
    }
  };

  // ======= Edit
  const handleEdit = async () => {
    if (!editing?.id) return;
    try {
      const values = await editForm.validateFields();
      const normalized: TicketType = {
        ...editing,
        ...values,
        showId: selectedShowId ?? editing.showId, // giữ theo show đang lọc
      };
      await dispatch(editTicketType({ id: editing.id, type: normalized })).unwrap();
      toast.success("Đã cập nhật loại vé");
      setOpenEdit(false);
      setEditing(null);
    } catch (e: any) {
      if (e?.errorFields) return;
      toast.error(e || "Cập nhật thất bại");
    }
  };

  // Validator tổng SL khi sửa: không được < số đã đặt
  const minByBookedValidator = (_: any, v: any) => {
    if (!editing) return Promise.resolve();
    const booked = getBookedFor(selectedShowId ?? editing.showId, editing.id);
    if (v == null || isNaN(v) || v < 0) return Promise.reject("Số lượng phải là số không âm");
    if (v < booked) return Promise.reject(`Tối thiểu ${booked} (đã đặt)`);
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-8">
      <Card
        className="w-full rounded-2xl shadow-lg mx-auto"
        bodyStyle={{ padding: 24 }}
        title={
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Title level={3} className="!mb-0">🎫 Ticket Types</Title>
            <div className="flex items-center gap-3">
              <Select
                allowClear
                showSearch
                placeholder="Chọn show để xem loại vé..."
                style={{ minWidth: 280 }}
                options={showOptions}
                optionFilterProp="label"
                value={selectedShowId ?? undefined}
                onChange={(v) => {
                  setSelectedShowId(v ?? null);
                  setCurrentPage(1);
                }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={onOpenAdd}>
                Thêm loại vé
              </Button>
            </div>
          </div>
        }
      >
        <Table<TypeRow>
          rowKey="id"
          loading={loading}
          dataSource={dataSource}
          columns={columns}
          onChange={handleTableChange}
          pagination={{ pageSize: PAGE_SIZE, showSizeChanger: false }}
          bordered
          size="middle"
          className="w-full rounded-xl shadow-sm"
        />
      </Card>

      {/* Modal Add */}
      <Modal
        title={`Thêm loại vé ${selectedShowId ? `cho show "${showTitleMap.get(selectedShowId) ?? ""}"` : ""}`}
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        onOk={handleAdd}
        okText="Thêm"
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          {/* Ẩn nhưng giữ giá trị showId = show đang chọn */}
          <Form.Item name="showId" hidden rules={[{ required: true, message: "Thiếu showId" }]} >
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên loại vé"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên loại vé" }]}
          >
            <Input placeholder="VD: Standard / VIP / VVIP" />
          </Form.Item>

          <Form.Item
            label="Màu"
            name="color"
            rules={[{ required: true, message: "Vui lòng nhập màu (vd: #FF9900 hoặc 'gold')" }]}
          >
            <Input placeholder="#FF9900 hoặc 'gold'" />
          </Form.Item>

          <Form.Item
            label="Giá"
            name="price"
            rules={[
              { required: true, message: "Vui lòng nhập giá" },
              {
                validator: (_: any, v: any) =>
                  v == null || isNaN(v) || v < 0
                    ? Promise.reject("Giá phải là số không âm")
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber min={0} className="w-full" placeholder="VD: 150000" />
          </Form.Item>

          <Form.Item
            label="Tổng số lượng"
            name="totalQuantity"
            rules={[
              { required: true, message: "Vui lòng nhập tổng số lượng" },
              {
                validator: (_: any, v: any) =>
                  v == null || isNaN(v) || v < 0
                    ? Promise.reject("Số lượng phải là số không âm")
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber min={0} className="w-full" placeholder="VD: 500" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        title={`Sửa loại vé ${selectedShowId ? `của show "${showTitleMap.get(selectedShowId) ?? ""}"` : ""}`}
        open={openEdit}
        onCancel={() => {
          setOpenEdit(false);
          setEditing(null);
        }}
        onOk={handleEdit}
        okText="Lưu thay đổi"
        confirmLoading={updating}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          {/* Ẩn nhưng giữ giá trị showId = show đang chọn */}
          <Form.Item name="showId" hidden rules={[{ required: true, message: "Thiếu showId" }]} >
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên loại vé"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên loại vé" }]}
          >
            <Input placeholder="VD: Standard / VIP / VVIP" />
          </Form.Item>

          <Form.Item
            label="Màu"
            name="color"
            rules={[{ required: true, message: "Vui lòng nhập màu (vd: #FF9900 hoặc 'gold')" }]}
          >
            <Input placeholder="#FF9900 hoặc 'gold'" />
          </Form.Item>

          <Form.Item
            label="Giá"
            name="price"
            rules={[
              { required: true, message: "Vui lòng nhập giá" },
              {
                validator: (_: any, v: any) =>
                  v == null || isNaN(v) || v < 0
                    ? Promise.reject("Giá phải là số không âm")
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber min={0} className="w-full" placeholder="VD: 150000" />
          </Form.Item>

          <Form.Item
            label="Tổng số lượng"
            name="totalQuantity"
            rules={[
              { required: true, message: "Vui lòng nhập tổng số lượng" },
              { validator: minByBookedValidator }, // ✅ không cho < đã đặt
            ]}
          >
            <InputNumber min={0} className="w-full" placeholder="VD: 500" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListType;
