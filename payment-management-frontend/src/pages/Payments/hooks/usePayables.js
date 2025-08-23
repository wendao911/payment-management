import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';
import { validatePayableData } from '../utils/helpers';

const { confirm } = Modal;

export const usePayables = () => {
  const [payables, setPayables] = useState([]);
  const [filteredPayables, setFilteredPayables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // 数据处理辅助函数 - 后端已经包含paymentRecords，无需额外调用
  const processPayablesData = async (payablesData) => {
    const processedData = [...payablesData];

    for (let payable of processedData) {
      // 确保数值字段有默认值
      payable.PayableAmount = payable.PayableAmount || 0;
      payable.TotalPaidAmount = payable.TotalPaidAmount || 0;
      payable.RemainingAmount = payable.RemainingAmount || 0;

      // 确保其他字段有默认值
      payable.CurrencySymbol = payable.CurrencySymbol || '';
      payable.ContractNumber = payable.ContractNumber || '';
      payable.SupplierName = payable.SupplierName || '';
      payable.Status = payable.Status || 'pending';
      payable.Importance = payable.Importance || 'normal';
      payable.Urgency = payable.Urgency || 'normal';

      // 确保paymentRecords字段存在，后端现在已经包含此字段
      if (!payable.paymentRecords) {
        payable.paymentRecords = [];
      }
    }

    return processedData;
  };

  const fetchPayables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment');
      if (response.success) {
        const payablesData = response.data || [];
        const processedData = await processPayablesData(payablesData);

        setPayables(processedData);
        setFilteredPayables(processedData);
      } else {
        setPayables([]);
        setFilteredPayables([]);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
      setPayables([]);
      setFilteredPayables([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.payableNumber) params.append('payableNumber', values.payableNumber);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.contractId) params.append('contractId', values.contractId);
      if (values.status) params.append('status', values.status);
      if (values.importance) params.append('importance', values.importance);
      if (values.urgency) params.append('urgency', values.urgency);
      if (values.paymentDueDateRange && values.paymentDueDateRange.length === 2) {
        params.append('startDate', values.paymentDueDateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.paymentDueDateRange[1].format('YYYY-MM-DD'));
      }

      const response = await apiClient.get(`/payment/search?${params.toString()}`);
      if (response.success) {
        const searchResults = response.data || [];
        const processedData = await processPayablesData(searchResults);

        setFilteredPayables(processedData);
      } else {
        message.error(response.message || '查询失败');
        setFilteredPayables([]);
      }
    } catch (error) {
      console.error('Error searching payables:', error);
      message.error('查询失败');
      setFilteredPayables([]);
    }
    setLoading(false);
  }, []);

  const handleReset = useCallback(async () => {
    await fetchPayables();
  }, [fetchPayables]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个应付管理记录吗？',
      onOk: async () => {
        try {
          await apiClient.delete(`/payment/${id}`);
          message.success('删除成功');
          fetchPayables();
        } catch (error) {
          console.error('Error deleting payable:', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchPayables]);

  const handlePayableSubmit = useCallback(async (values, editingPayable) => {
    try {
      // 验证数据
      const errors = validatePayableData(values);
      if (errors.length > 0) {
        message.error(errors.join('\n'));
        return;
      }

      if (editingPayable) {
        // 更新应付管理
        const editingId = editingPayable.Id || editingPayable.id;
        const updateResponse = await apiClient.put(`/payment/${editingId}`, values);
        if (updateResponse.success) {
          message.success('更新成功');
          // 更新成功后，重新获取该条记录的详细信息
          try {
            const detailResponse = await apiClient.get(`/payment/${editingId}`);
            if (detailResponse.success && detailResponse.data) {
              // 更新本地数据
              setPayables(prevPayables =>
                prevPayables.map(payable =>
                  (payable.Id || payable.id) === editingId
                    ? { ...payable, ...detailResponse.data }
                    : payable
                )
              );
              setFilteredPayables(prevFiltered =>
                prevFiltered.map(payable =>
                  (payable.Id || payable.id) === editingId
                    ? { ...payable, ...detailResponse.data }
                    : payable
                )
              );
            }
          } catch (error) {
            console.warn('更新后获取详情失败，使用通用刷新:', error);
            // 如果获取详情失败，使用通用刷新
            fetchPayables();
          }
        } else {
          message.error(updateResponse.message || '更新失败');
          return false;
        }
      } else {
        // 创建新应付管理
        await apiClient.post('/payment', values);
        message.success('创建成功');
        // 创建成功后刷新列表
        fetchPayables();
      }

      return true;
    } catch (error) {
      console.error('Error saving payable:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join('\n');
        message.error(`保存失败：\n${errorMessages}`);
      } else if (error.response && error.response.data && error.response.data.message) {
        message.error(`保存失败：${error.response.data.message}`);
      } else {
        message.error('保存失败');
      }
      return false;
    }
  }, [fetchPayables]);

  const handleWarningViewDetails = useCallback(async (type) => {
    try {
      setLoading(true);
      let apiEndpoint = '';
      let messageText = '';
      
      switch (type) {
        case 'overdue':
          apiEndpoint = '/payment/overdue/list';
          messageText = '已过滤显示逾期付款';
          break;
        case 'upcoming':
          apiEndpoint = '/payment/upcoming/list';
          messageText = '已过滤显示7天内到期的付款';
          break;
        case 'important':
          apiEndpoint = '/payment/important/list';
          messageText = '已过滤显示重要付款';
          break;
        case 'all':
          apiEndpoint = '/payment/warnings/list';
          messageText = '已过滤显示所有预警付款';
          break;
        default:
          return;
      }
      
      // 调用接口获取过滤后的数据
      const response = await apiClient.get(apiEndpoint);
      if (response.success) {
        const filteredData = response.data || [];
        const processedData = await processPayablesData(filteredData);
        setFilteredPayables(processedData);
        message.success(messageText);
      } else {
        message.error(response.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取预警数据失败:', error);
      message.error('获取预警数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payables,
    filteredPayables,
    loading,
    editLoading,
    setEditLoading,
    fetchPayables,
    handleSearch,
    handleReset,
    handleDelete,
    handlePayableSubmit,
    handleWarningViewDetails
  };
};
