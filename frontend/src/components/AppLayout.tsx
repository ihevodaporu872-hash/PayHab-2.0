import { useState } from 'react';
import type { FC } from 'react';
import { Layout, Menu, Button, theme, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  ProjectOutlined,
  DollarOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const { Header, Sider, Content } = Layout;

export const AppLayout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    {
      key: 'requests',
      icon: <FileTextOutlined />,
      label: 'Заявка-Объект',
      children: [
        {
          key: '/requests',
          icon: <UnorderedListOutlined />,
          label: 'Список заявок',
        },
        {
          key: '/requests/new',
          icon: <PlusOutlined />,
          label: 'Новая заявка',
        },
      ],
    },
    {
      key: 'references',
      icon: <ProjectOutlined />,
      label: 'Справочники',
      children: [
        { key: '/projects', label: 'Проекты' },
        { key: '/cost-types', icon: <DollarOutlined />, label: 'Виды затрат' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
      >
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? 'PH' : 'PayHub 2.0'}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['requests', 'references']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Typography.Text>{username}</Typography.Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login'); }} />
          </div>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
