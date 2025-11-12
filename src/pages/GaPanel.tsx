import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchGaDaily, selectGa, selectGaTotals, setGaRange } from "../redux/GaSlice";
import { Card, DatePicker, Spin, Typography, Space, Row, Col } from "antd";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

function toLabel(yyyymmdd: string) {
    // "20251113" -> "13/11"
    if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
    const d = `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}`;
    return d;
}

function toGaRangeFromDates(d1?: Dayjs, d2?: Dayjs) {
    if (!d1 || !d2) return { start: "7daysAgo", end: "today" };
    // GA4 Data API nhận "YYYY-MM-DD" ổn
    return { start: d1.format("YYYY-MM-DD"), end: d2.format("YYYY-MM-DD") };
}

const presets: Array<{ label: string; get: () => [Dayjs, Dayjs] }> = [
    { label: "7 ngày", get: () => [dayjs().subtract(6, "day"), dayjs()] },
    { label: "30 ngày", get: () => [dayjs().subtract(29, "day"), dayjs()] },
    { label: "Tháng này", get: () => [dayjs().startOf("month"), dayjs()] },
];

const GaPanel: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items, loading, error, range } = useSelector((s: RootState) => selectGa(s));
    const totals = useSelector((s: RootState) => selectGaTotals(s));

    const [dates, setDates] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(6, "day"), dayjs()]);

    // load lần đầu
    useEffect(() => {
        dispatch(fetchGaDaily(range));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // data cho chart
    const chartData = useMemo(
        () =>
            (items ?? []).map((d) => ({
                date: toLabel(d.date),
                activeUsers: d.activeUsers ?? 0,
                pageViews: d.pageViews ?? 0,
            })),
        [items]
    );

    const onRangeChange = (vals: null | [Dayjs, Dayjs]) => {
        if (!vals) return;
        setDates(vals);
        const r = toGaRangeFromDates(vals[0], vals[1]);
        dispatch(setGaRange(r));
        dispatch(fetchGaDaily(r));
    };

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Row gutter={[16, 16]} align="middle">
                <Col flex="auto">
                    <Title level={4} style={{ margin: 0 }} className="!text-white">Lượt truy cập (GA4)</Title>
                    <Text type="secondary" className="!text-white">Nguồn: Google Analytics 4</Text>
                </Col>
                <Col>
                    <RangePicker
                        value={dates}
                        onChange={(v) => onRangeChange(v as any)}
                        allowClear={false}
                        presets={presets.map(p => ({ label: p.label, value: () => p.get() }))}
                        format="DD/MM/YYYY"
                    />
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Text type="secondary">Active Users</Text>
                        <Title level={3} style={{ marginTop: 8 }}>{totals.activeUsers.toLocaleString("vi-VN")}</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Text type="secondary">Page Views</Text>
                        <Title level={3} style={{ marginTop: 8 }}>{totals.pageViews.toLocaleString("vi-VN")}</Title>
                    </Card>
                </Col>
                {/* Có thể thêm Sessions/NewUsers sau nếu BE cung cấp */}
            </Row>

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center h-80"><Spin /></div>
                ) : error ? (
                    <Text type="danger">{error}</Text>
                ) : (
                    <div className="h-80"> {/* hoặc h-72/h-96 tuỳ layout */}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                                barCategoryGap={12}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="activeUsers" name="Active Users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="pageViews" name="Page Views" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>
        </Space>
    );
};

export default GaPanel;
