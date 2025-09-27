// pages/ListShow.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Card,
  Input,
  Space,
  Button,
  Modal,
  Popconfirm,
  Tag,
  Radio,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchShows,
  editShow,
  removeShow,
  setDefaultShow,
  hydrateDefaultShow,
} from "../redux/ShowSlice";
import ShowForm, { ShowFormValues } from "../components/ShowForm";
import dayjs from "dayjs";
import { Show } from "../types/Show";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const ListShow: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, defaultId } = useAppSelector((s) => s.shows);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Show | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(hydrateDefaultShow());
    dispatch(fetchShows());
  }, [dispatch]);

  // debounce input
  const [internal, setInternal] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(internal.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [internal]);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((x) => x.title?.toLowerCase().includes(query));
  }, [items, query]);

  const onEdit = (show: Show) => {
    setEditing(show);
    setOpen(true);
    toast.success("Sửa show thành công!!!")
  };

  const onDelete = async (id: number) => {
    await dispatch(removeShow(id));
    toast.success("Xoá show thành công!!!")
  };

  const onSubmitEdit = async (v: ShowFormValues) => {
    if (!editing) return;
    const updated: Show = {
      ...editing,
      title: v.title,
      description: v.description,
      date: v.date, // Date
      location: v.location,
      bannerUrl: v.bannerUrl,
      capacity: v.capacity, // string
      slogan: v.slogan,
    };
    // theo service của bạn: updateShow(title, show)
    await dispatch(editShow({ title: editing.title, show: updated }));
    setOpen(false);
    setEditing(null);
  };

  const columns = [
    {
      title: "",
      dataIndex: "id",
      width: 56,
      render: (_: any, record: Show) => (
        <Radio
          checked={record.id === defaultId}
          onChange={() => record.id && dispatch(setDefaultShow(record.id))}
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      render: (t: string, r: Show) => (
        <Space>
          {r.id === defaultId && <CheckCircleTwoTone twoToneColor="#52c41a" />}
          <Text strong>{t}</Text>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "date",
      render: (d: string | Date) =>
        d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-",
      width: 180,
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      ellipsis: true,
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      width: 110,
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: "Slogan",
      dataIndex: "slogan",
      ellipsis: true,
    },
    {
      title: "Hành động",
      dataIndex: "actions",
      width: 140,
      render: (_: any, record: Show) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xoá show?"
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => onDelete(record.id!)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <Title level={4} className="!mb-0">Danh sách Show</Title>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tiêu đề..."
            className="rounded-xl shadow-sm focus:shadow-md transition-all"
            onChange={(e) => setInternal(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <Text type="secondary">
            Tích vào nút tròn để đặt <b>Show mặc định</b>. Hàng có biểu tượng{" "}
            <CheckCircleTwoTone twoToneColor="#52c41a" /> là show mặc định hiện tại.
          </Text>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          columns={columns as any}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title="Sửa Show"
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); }}
        footer={null}
        destroyOnClose
      >
        <ShowForm
          initial={editing ?? undefined}
          loading={loading}
          onSubmit={onSubmitEdit}
          submitText="Lưu thay đổi"
        />
      </Modal>
    </div>
  );
};

export default ListShow;
