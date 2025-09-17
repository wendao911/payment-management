import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';

const { confirm } = Modal;

export const useBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/bank-accounts');
      if (result.success) {
        const accountsData = result.data || [];
        console.log('获取到的银行账户数据:', accountsData);
        setAccounts(accountsData);
        setFilteredAccounts(accountsData);
      } else {
        message.error(result.message || '获取银行账户列表失败');
        setAccounts([]);
        setFilteredAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      message.error('获取银行账户列表失败');
      setAccounts([]);
      setFilteredAccounts([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.accountNumber) params.append('accountNumber', values.accountNumber);
      if (values.accountName) params.append('accountName', values.accountName);
      if (values.bankId) params.append('bankId', values.bankId);
      if (values.accountType) params.append('accountType', values.accountType);
      if (values.currencyCode) params.append('currency', values.currencyCode);
      if (values.isActive !== undefined) params.append('isActive', values.isActive);
      
      const result = await apiClient.get(`/bank-accounts/search?${params.toString()}`);
      if (result.success) {
        setFilteredAccounts(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredAccounts([]);
      }
    } catch (error) {
      console.error('Error searching accounts:', error);
      message.error('查询失败');
      setFilteredAccounts([]);
    }
    setLoading(false);
  }, []);

  const handleReset = useCallback(async () => {
    // 重置时重新获取所有数据
    await fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个银行账户吗？删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在删除...', 0);
        try {
          const result = await apiClient.delete(`/bank-accounts/${id}`);
          if (result.success) {
            hide();
            message.success('删除成功');
            fetchAccounts();
          } else {
            hide();
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          hide();
          console.error('Error deleting account:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchAccounts]);

  const handleDeleteBalance = useCallback(async (balanceId) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个余额记录吗？删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在删除...', 0);
        try {
          const result = await apiClient.delete(`/bank-account-balances/${balanceId}`);
          if (result.success) {
            hide();
            message.success('删除成功');
            fetchAccounts();
          } else {
            hide();
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          hide();
          console.error('Error deleting balance:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchAccounts]);

  return {
    accounts,
    filteredAccounts,
    loading,
    fetchAccounts,
    handleSearch,
    handleReset,
    handleDelete,
    handleDeleteBalance
  };
};
