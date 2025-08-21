import React, { useState } from 'react';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './components/LoginForm';
import LoginLayout from './components/LoginLayout';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 添加调试信息
  console.log('Login组件渲染', { location: location.pathname });

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        message.success('登录成功！');
        navigate(from, { replace: true });
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('登录失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      <LoginForm
        onFinish={onFinish}
        loading={loading}
      />
    </LoginLayout>
  );
};

export default Login;
