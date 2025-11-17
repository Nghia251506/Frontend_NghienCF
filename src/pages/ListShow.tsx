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
  Grid,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import {
  fetchShows,
  editShow,
  removeShow,
  setDefaultShow,
  hydrateDefaultShow,
  setDefaultShowRemote
} from "../redux/ShowSlice";
import ShowForm, { ShowFormValues } from "../components/ShowForm";
import dayjs from "dayjs";
import { Show } from "../types/Show";
import { toast } from "react-toastify";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ListShow: React.FC = () => {
  const dispatch = useAppDispatch();
  const screens = useBreakpoint();
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
    const activeOnly = items.filter((x) => x.deleteStatus !== "Deleted"); // hoặc !== "NonAction" theo bạn

    if (!query) return activeOnly;
    return activeOnly.filter((x) =>
      x.title?.toLowerCase().includes(query)
    );
  }, [items, query]);

  const onEdit = (show: Show) => {
    setEditing(show);
    setOpen(true);
  };

  const onDelete = async (id: number) => {
    await dispatch(removeShow(id));
    toast.success("Xoá show thành công!!!");
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
      totalSeats: v.totalSeats, // string | number (tùy kiểu của bạn)
      slogan: v.slogan,
    };
    await dispatch(editShow({ title: editing.title, show: updated }));
    toast.success("Sửa show thành công!!!");
    setOpen(false);
    setEditing(null);
  };

  // ===== Columns responsive
  const columns: any[] = useMemo(
    () => [
      // Cột gộp cho mobile/tablet
      {
        title: "Thông tin",
        dataIndex: "info",
        responsive: ["xs"], // hiện ở xs/sm; các cột chi tiết sẽ responsive: ["md"]
        render: (_: any, r: Show) => (
          <div className="min-w-[280px]">
            <div className="flex items-center gap-2">
              {r.id === defaultId && <CheckCircleTwoTone twoToneColor="#52c41a" />}
              <Text strong>{r.title}</Text>
            </div>

            <div className="mt-1 grid grid-cols-1 gap-1 text-[13px] text-gray-300">
              <div>
                <span className="text-gray-400">Thời gian:</span>{" "}
                <b>{r.date ? dayjs(r.date).format("DD/MM/YYYY HH:mm") : "-"}</b>
              </div>
              <div className="truncate">
                <span className="text-gray-400">Địa điểm:</span>{" "}
                <span title={r.location || "-"}>{r.location || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Sức chứa:</span>
                <Tag className="m-0">{r.totalSeats ?? "-"}</Tag>
              </div>
              {r.slogan && (
                <div className="truncate">
                  <span className="text-gray-400">Slogan:</span>{" "}
                  <span title={r.slogan}>{r.slogan}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <Radio
                checked={r.id === defaultId}
                onChange={() => {
                  if (!r.id) return;
                  if (r.id === defaultId) return;
                  // optimistic: đổi trên FE trước cho mượt
                  dispatch(setDefaultShow(r.id));
                  // gọi BE để lưu thật
                  dispatch(setDefaultShowRemote(r.id));
                }}
              >
                Đặt mặc định
              </Radio>

              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(r)}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xoá show?"
                  okText="Xoá"
                  cancelText="Huỷ"
                  onConfirm={() => onDelete(r.id!)}
                >
                  <Button danger icon={<DeleteOutlined />} size="small">
                    Xoá
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
        ),
      },

      // Các cột chi tiết (desktop từ md)
      {
        title: "",
        dataIndex: "id",
        width: 64,
        responsive: ["md"],
        render: (_: any, record: Show) => (
          <div className="flex justify-center">
            <Radio
              checked={record.id === defaultId}
              onChange={() => {
                if (!record.id) return;
                if (record.id === defaultId) return;
                // optimistic: đổi trên FE trước cho mượt
                dispatch(setDefaultShow(record.id));
                // gọi BE để lưu thật
                dispatch(setDefaultShowRemote(record.id));
              }}
            />
          </div>
        ),
      },
      {
        title: "Tiêu đề",
        dataIndex: "title",
        responsive: ["md"],
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
        width: 200,
        responsive: ["md"],
        render: (d: string | Date) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-"),
      },
      {
        title: "Địa điểm",
        dataIndex: "location",
        ellipsis: true,
        responsive: ["md"],
      },
      {
        title: "Sức chứa",
        dataIndex: "totalSeats",
        width: 120,
        responsive: ["md"],
        render: (c: string | number) => <Tag className="m-0">{c ?? "-"}</Tag>,
      },
      {
        title: "Slogan",
        dataIndex: "slogan",
        ellipsis: true,
        responsive: ["lg"],
      },
      {
        title: "Hành động",
        dataIndex: "actions",
        width: 160,
        fixed: screens.lg ? undefined : "right",
        responsive: ["md"],
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
    ],
    [defaultId, screens.lg, dispatch]
  );

  return (
    <div className="w-full">
      <Card
        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg"
        bodyStyle={{ padding: 16 }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Title level={4} className="!mb-0 !text-white">Danh sách Show</Title>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tiêu đề..."
              className="rounded-xl shadow-sm focus:shadow-md transition-all sm:w-[320px]"
              onChange={(e) => setInternal(e.target.value)}
            />
          </div>
        }
      >
        <div className="mb-3 text-gray-300">
          Tích vào nút tròn để đặt <b>Show mặc định</b>. Hàng có biểu tượng{" "}
          <CheckCircleTwoTone twoToneColor="#52c41a" /> là show mặc định hiện tại.
        </div>

        <div className="w-full overflow-x-auto">
          <Table<Show>
            rowKey="id"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size={screens.md ? "middle" : "small"}
            className="min-w-[720px] md:min-w-0 rounded-xl"
            scroll={{ x: 720 }}
          />
        </div>
      </Card>

      <Modal
        title="Sửa Show"
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
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
