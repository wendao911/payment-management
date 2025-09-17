import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';

const { confirm } = Modal;

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/supplier');
      if (result.success) {
        const suppliersData = result.data || [];
        setSuppliers(suppliersData);
        setFilteredSuppliers(suppliersData);
      } else {
        message.error(result.message || '获取供应商列表失败');
        setSuppliers([]);
        setFilteredSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('获取供应商列表失败');
      setSuppliers([]);
      setFilteredSuppliers([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.Name) params.append('supplierName', values.Name);
      if (values.ContactPerson) params.append('contactPerson', values.ContactPerson);
      if (values.Phone) params.append('phone', values.Phone);
      if (values.Email) params.append('email', values.Email);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);
      
      const result = await apiClient.get(`/supplier/search?${params.toString()}`);
      if (result.success) {
        setFilteredSuppliers(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredSuppliers([]);
      }
    } catch (error) {
      console.error('Error searching suppliers:', error);
      message.error('查询失败');
      setFilteredSuppliers([]);
    }
    setLoading(false);
  }, []);

  const handleReset = useCallback(async () => {
    // 重置时重新获取所有数据
    await fetchSuppliers();
  }, [fetchSuppliers]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个供应商吗？删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在删除...', 0);
        try {
          const result = await apiClient.delete(`/supplier/${id}`);
          if (result.success) {
            hide();
            message.success('删除成功');
            fetchSuppliers();
          } else {
            hide();
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          hide();
          console.error('Error deleting supplier:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchSuppliers]);

  return {
    suppliers,
    filteredSuppliers,
    loading,
    fetchSuppliers,
    handleSearch,
    handleReset,
    handleDelete
  };
};
