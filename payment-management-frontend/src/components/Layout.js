import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, theme, Dropdown, Avatar, Space, Breadcrumb } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  GlobalOutlined,
  BankOutlined,
  AccountBookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ToolOutlined,
  HomeOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState(['basic-config']); // 默认展开基础配置菜单
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const siderWidth = 200;
  const siderCollapsedWidth = 80;
  const headerHeight = 64;

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'basic-config',
      icon: <ToolOutlined />,
      label: '基础配置',
      children: [
        {
          key: '/countries',
          icon: <GlobalOutlined />,
          label: '国家管理',
        },
        {
          key: '/currencies',
          icon: <GlobalOutlined />,
          label: '币种管理',
        },
        {
          key: '/banks',
          icon: <BankOutlined />,
          label: '银行管理',
        },
        {
          key: '/suppliers',
          icon: <TeamOutlined />,
          label: '供应商管理',
        },
      ],
    },
    {
      key: '/bank-accounts',
      icon: <AccountBookOutlined />,
      label: '银行账户',
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: '合同管理',
    },
    {
      key: 'payment-management',
      icon: <CreditCardOutlined />,
      label: '应付管理',
      children: [
        {
          key: '/payments',
          icon: <CreditCardOutlined />,
          label: '应付管理',
        },
        {
          key: '/payment-records',
          icon: <AccountBookOutlined />,
          label: '付款记录',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 生成面包屑导航
  const generateBreadcrumb = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = [
      {
        title: <HomeOutlined />,
        onClick: () => navigate('/dashboard'),
      },
    ];

    if (pathSnippets.length === 0) {
      breadcrumbItems.push({
        title: '仪表板',
      });
    } else {
      // 根据路径生成面包屑
      const pathMap = {
        'countries': '国家管理',
        'currencies': '币种管理',
        'banks': '银行管理',
        'suppliers': '供应商管理',
        'bank-accounts': '银行账户',
        'contracts': '合同管理',
        'payments': '应付管理',
        'payment-records': '付款记录',
      };

      pathSnippets.forEach((snippet, index) => {
        const title = pathMap[snippet] || snippet;
        breadcrumbItems.push({
          title: title,
          onClick: index === pathSnippets.length - 1 ? undefined : () => navigate('/' + pathSnippets.slice(0, index + 1).join('/')),
        });
      });
    }

    return breadcrumbItems;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={siderWidth}
        collapsedWidth={siderCollapsedWidth}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="demo-logo-vertical" >
          <img src={logo} alt="logo" style={{ width: '100%', height: '100%' }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? siderCollapsedWidth : siderWidth }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'fixed',
            top: 0,
            left: collapsed ? siderCollapsedWidth : siderWidth,
            right: 0,
            height: `${headerHeight}px`,
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <span className="text-xl font-semibold ml-4">应付管理系统</span>
          </div>
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.Username || '用户'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            marginTop: headerHeight + 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Breadcrumb 
            items={generateBreadcrumb()} 
            style={{ marginBottom: 16 }}
            separator=">"
          />
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
