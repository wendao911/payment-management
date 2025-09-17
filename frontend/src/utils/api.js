import axios from 'axios';

// 固定默认后端地址，允许通过 .env 的 REACT_APP_API_URL 覆盖
// const DEFAULT_API_BASE_URL = 'http://10.125.5.103:5000/api';
const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

// 获取后端服务器地址（优先 .env，回退固定地址），并做基础校验与清洗
const getBackendURL = () => {
  let candidate = (process.env.REACT_APP_API_URL || '').trim() || DEFAULT_API_BASE_URL;
  // 基础校验：必须以 http(s):// 开头
  if (!/^https?:\/\//i.test(candidate)) {
    console.warn('检测到无效的 API 地址（缺少协议），回退为默认值:', candidate);
    candidate = DEFAULT_API_BASE_URL;
  }
  // 规范化：去掉末尾斜杠，避免与以 / 开头的路由拼接产生双斜杠
  candidate = candidate.replace(/\/+$/, '');
  return candidate;
};

// 创建axios实例
const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 15000,
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
    // 添加详细的错误日志
    console.error('API请求错误:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      },
      response: error.response?.data
    });
    
    // 如果是401错误，清除token并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    // 如果是网络错误，提供更友好的提示
    if (error.code === 'ERR_NETWORK') {
      console.error('网络连接失败，请检查:');
      console.error('1. 后端服务器是否启动');
      console.error('2. 端口5000是否被占用');
      console.error('3. 防火墙设置');
      console.error('4. API地址配置:', getBackendURL());
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
  },

  // 导出Excel文件
  exportExcel: async (url, params = {}, filename = 'export.xlsx') => {
    try {
      const response = await api.get(url, {
        params,
        responseType: 'blob'
      });
      
      // 创建下载链接
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, message: '导出成功' };
    } catch (error) {
      console.error('导出Excel失败:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '导出失败',
        error 
      };
    }
  }
};

export default api;
