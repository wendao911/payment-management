import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';

const { confirm } = Modal;

export const useBanks = () => {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/banks');
      if (result.success) {
        const banksData = result.data || [];
        setBanks(banksData);
        setFilteredBanks(banksData);
      } else {
        message.error(result.message || '获取银行列表失败');
        setBanks([]);
        setFilteredBanks([]);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      message.error('获取银行列表失败');
      setBanks([]);
      setFilteredBanks([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.BankCode) params.append('bankCode', values.BankCode);
      if (values.BankName) params.append('bankName', values.BankName);
      if (values.BankType) params.append('bankType', values.BankType);
      if (values.CountryId) params.append('countryId', values.CountryId);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);
      
      const result = await apiClient.get(`/banks/search?${params.toString()}`);
      if (result.success) {
        setFilteredBanks(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredBanks([]);
      }
    } catch (error) {
      console.error('Error searching banks:', error);
      message.error('查询失败');
      setFilteredBanks([]);
    }
    setLoading(false);
  }, []);

  const handleReset = useCallback(async () => {
    // 重置时重新获取所有数据
    await fetchBanks();
  }, [fetchBanks]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个银行吗？删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在删除...', 0);
        try {
          const result = await apiClient.delete(`/banks/${id}`);
          if (result.success) {
            hide();
            message.success('删除成功');
            fetchBanks();
          } else {
            hide();
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          hide();
          console.error('Error deleting bank:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchBanks]);

  return {
    banks,
    filteredBanks,
    loading,
    fetchBanks,
    handleSearch,
    handleReset,
    handleDelete
  };
};
