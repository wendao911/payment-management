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

// 创建axios实例
const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理响应数据
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据，让调用方处理
    return response;
  },
  (error) => {
    // 如果是401错误，清除token并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 导出getBackendURL函数
export { getBackendURL };

// 通用API方法
export const apiClient = {
  // GET请求
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '请求失败',
        error 
      };
    }
  },

  // POST请求
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '请求失败',
        error 
      };
    }
  },

  // PUT请求
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '请求失败',
        error 
      };
    }
  },

  // DELETE请求
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '请求失败',
        error 
      };
    }
  }
};

export default api;
