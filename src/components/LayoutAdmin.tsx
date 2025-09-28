import React, { useState } from 'react';
import {
  LogoutOutlined,
  PieChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { FaMusic } from "react-icons/fa";
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useSelector } from "react-redux"; // ✅ để lấy user
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";
import { logout } from "../redux/UserSlice";
import "react-toastify/dist/ReactToastify.css";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Thống kê', 'dashboard', <PieChartOutlined />),
  getItem('Quản lý show', 'show', <FaMusic />, [
    getItem('Danh sách combo', 'listtype'),
    getItem('Show', 'addshow'),
    getItem('Danh sách đặt', 'listorder'),
    getItem('Danh sách show diễn', 'listshow'),
  ]),
  getItem('Thiết kế', 'design', <TeamOutlined />),
];

const LayoutAdmin: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { currentUser } = useSelector((state: RootState) => state.auth); // ✅ lấy user từ redux
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Đăng xuất thành công!");
    navigate("/login"); // quay về login
  };
  const onClick: MenuProps['onClick'] = (e) => {
    navigate(`/admin/${e.key}`);
    toast.info(`Đang chuyển đến trang: ${e.key}`); // ví dụ toast khi click menu
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flex: 1 }}>
            {/* Welcome user */}
            {!collapsed && (
              <div style={{ color: "white", padding: 16 }}>
                Welcome, <b>ntn8530</b>
              </div>
            )}
            <Menu
              theme="dark"
              defaultSelectedKeys={["dashboard"]}
              mode="inline"
              items={items}
              onClick={onClick}
            />
          </div>

          {/* Nút logout */}
          <div style={{ padding: 16 }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <LogoutOutlined />
              {!collapsed && "Đăng xuất"}
            </button>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={[{ title: 'Admin' }, { title: 'Dashboard' }]} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Admin Dashboard ©{new Date().getFullYear()}
        </Footer>
      </Layout>

      {/* Toast container luôn nằm ở cuối layout */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </Layout>
  );
};

export default LayoutAdmin;
