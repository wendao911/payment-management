import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 动态获取后端服务器地址
const getBackendURL = () => {
  // 检查环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 如果是本地开发，使用当前页面的主机名
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // 局域网访问时，使用当前页面的主机名，但端口改为5000
    return `http://${window.location.hostname}:5000/api`;
  }
  // 本地开发使用当前页面的主机名和端口5000
  return `http://${window.location.hostname}:5000/api`;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查localStorage中是否有token
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        
        // 设置axios默认headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // 验证token是否有效
        validateToken(storedToken);
      } catch (error) {
        console.error('解析存储的用户数据失败:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await axios.get(`${getBackendURL()}/auth/me`);
      if (response.data.success) {
        setUser(response.data.data);
        setLoading(false);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token验证失败:', error);
      logout();
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${getBackendURL()}/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        
        // 保存到localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 设置状态
        setToken(newToken);
        setUser(userData);
        
        // 设置axios默认headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      };
    }
  };

  const logout = () => {
    // 清除localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 清除状态
    setToken(null);
    setUser(null);
    
    // 清除axios默认headers
    delete axios.defaults.headers.common['Authorization'];
    
    // 调用后端登出接口（可选）
    if (token) {
      axios.post(`${getBackendURL()}/auth/logout`).catch(console.error);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user && user.Role === role;
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  const isManager = () => {
    return hasRole('manager') || hasRole('admin');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
    isAdmin,
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
