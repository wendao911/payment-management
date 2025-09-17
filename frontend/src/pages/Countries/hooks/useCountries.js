import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';

const { confirm } = Modal;

export const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/countries');
      if (result.success) {
        const countriesData = result.data || [];
        setCountries(countriesData);
        setFilteredCountries(countriesData);
      } else {
        message.error(result.message || '获取国家列表失败');
        setCountries([]);
        setFilteredCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      message.error('获取国家列表失败');
      setCountries([]);
      setFilteredCountries([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.countryCode) params.append('code', values.countryCode);
      if (values.countryName) params.append('name', values.countryName);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);

      const result = await apiClient.get(`/countries/search?${params.toString()}`);
      if (result.success) {
        setFilteredCountries(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredCountries([]);
      }
    } catch (error) {
      console.error('Error searching countries:', error);
      message.error('查询失败');
      setFilteredCountries([]);
    }
    setLoading(false);
  }, []);

  const handleReset = useCallback(async () => {
    // 重置时重新获取所有数据
    await fetchCountries();
  }, [fetchCountries]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个国家吗？删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在删除...', 0);
        try {
          const result = await apiClient.delete(`/countries/${id}`);
          if (result.success) {
            hide();
            message.success('删除成功');
            fetchCountries();
          } else {
            hide();
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          hide();
          console.error('Error deleting country:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchCountries]);

  return {
    countries,
    filteredCountries,
    loading,
    fetchCountries,
    handleSearch,
    handleReset,
    handleDelete
  };
};
