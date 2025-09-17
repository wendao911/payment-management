import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../../../utils/api';
import { validatePaymentRecordData } from '../utils/helpers';
import dayjs from '../../../utils/dayjs';

const { confirm } = Modal;

export const usePaymentRecords = () => {
  const [selectedPayableId, setSelectedPayableId] = useState(null);

  const handleAddPaymentRecord = useCallback((payableId) => {
    setSelectedPayableId(payableId);
    return true;
  }, []);

  const handlePaymentRecordSubmit = useCallback(async (values) => {
    try {
      // 验证数据
      const errors = validatePaymentRecordData(values);
      if (errors.length > 0) {
        message.error(errors.join('\n'));
        return false;
      }

      const response = await apiClient.post('/payment-records', {
        // 与后端校验字段一致（PascalCase）
        PaymentNumber: values.PaymentNumber,
        PayableManagementId: selectedPayableId,
        CurrencyCode: values.CurrencyCode,
        PaymentDescription: values.PaymentDescription,
        PaymentAmount: values.PaymentAmount,
        PaymentDate: values.PaymentDate ? dayjs(values.PaymentDate).format('YYYY-MM-DD') : undefined,
        Notes: values.Notes,
      });

      console.log('创建付款记录响应:', response);

      // 检查响应结构，兼容不同的返回格式
      const isSuccess = response.success || response.data?.success;
      const responseMessage = response.message || response.data?.message;

      if (isSuccess) {
        message.success('付款记录创建成功');
        return true;
      } else {
        message.error(responseMessage || '创建付款记录失败');
        return false;
      }
    } catch (error) {
      console.error('Error creating payment record:', error);
      if (error.response?.data?.message) {
        message.error(`创建付款记录失败: ${error.response.data.message}`);
      } else {
        message.error('创建付款记录失败');
      }
      return false;
    }
  }, [selectedPayableId]);

  const handleViewPaymentRecord = useCallback(async (paymentRecord) => {
    try {
      const id = paymentRecord.Id || paymentRecord.id;
      console.log('正在获取付款记录详情，ID:', id);

      const response = await apiClient.get(`/payment-records/detail/${id}`);
      console.log('付款记录详情接口响应:', response);

      if (response.success) {
        const paymentRecordData = response.data;

        // 后端已经返回了附件信息，直接使用
        // 确保附件字段存在，如果没有则设为空数组
        if (!paymentRecordData.attachments) {
          paymentRecordData.attachments = [];
        }

        console.log('付款记录详情数据:', paymentRecordData);
        console.log('附件数量:', paymentRecordData.attachments?.length || 0);
        return paymentRecordData;
      } else {
        console.warn('获取付款记录详情失败，使用现有数据');
        return paymentRecord;
      }
    } catch (error) {
      console.warn('获取付款记录详情失败，使用现有数据:', error);
      return paymentRecord;
    }
  }, []);

  const handleEditPaymentRecord = useCallback(async (paymentRecord) => {
    try {
      const id = paymentRecord.Id || paymentRecord.id;
      console.log('正在获取付款记录详情用于编辑，ID:', id);

      // 编辑时先调用后端接口获取最新数据
      const response = await apiClient.get(`/payment-records/detail/${id}`);
      console.log('编辑付款记录详情接口响应:', response);

      if (response.success) {
        const paymentRecordData = response.data;

        // 后端已经返回了附件信息，直接使用
        // 确保附件字段存在，如果没有则设为空数组
        if (!paymentRecordData.attachments) {
          paymentRecordData.attachments = [];
        }

        console.log('编辑付款记录详情数据:', paymentRecordData);
        console.log('附件数量:', paymentRecordData.attachments?.length || 0);
        return paymentRecordData;
      } else {
        console.warn('获取付款记录详情失败，使用现有数据');
        return paymentRecord;
      }
    } catch (error) {
      console.warn('获取付款记录详情失败，使用现有数据:', error);
      return paymentRecord;
    }
  }, []);

  const handlePaymentRecordEdit = useCallback(async (values, editingPaymentRecord, onSuccess) => {
    try {
      const id = editingPaymentRecord.Id || editingPaymentRecord.id;
      if (!id) {
        message.error('无法识别要编辑的付款记录ID');
        return false;
      }

      const response = await apiClient.put(`/payment-records/${id}`, values);
      if (response.success) {
        message.success('更新成功');
        onSuccess();
        return true;
      } else {
        message.error(response.message || '更新失败');
        return false;
      }
    } catch (error) {
      console.error('更新付款记录失败:', error);
      if (error.response?.message) {
        message.error(`更新失败: ${error.response.message}`);
      } else {
        message.error('更新失败，请稍后重试');
      }
      return false;
    }
  }, []);

  const handleDeletePaymentRecord = useCallback(async (paymentRecord, onSuccess) => {
    const id = paymentRecord.Id || paymentRecord.id;
    if (!id) {
      message.error('无法识别付款记录ID');
      return;
    }

    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个付款记录吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const response = await apiClient.delete(`/payment-records/${id}`);
          console.log('删除付款记录响应:', response);

          // 检查响应结构，兼容不同的返回格式
          const isSuccess = response.success || response.data?.success;
          const responseMessage = response.message || response.data?.message;

          if (isSuccess) {
            message.success('删除成功');
            onSuccess();
          } else {
            message.error(responseMessage || '删除失败');
          }
        } catch (error) {
          console.error('删除付款记录失败:', error);
          if (error.response?.data?.message) {
            message.error(`删除失败: ${error.response.data.message}`);
          } else {
            message.error('删除失败，请稍后重试');
          }
        }
      },
    });
  }, []);

  return {
    selectedPayableId,
    setSelectedPayableId,
    handleAddPaymentRecord,
    handlePaymentRecordSubmit,
    handleViewPaymentRecord,
    handleEditPaymentRecord,
    handlePaymentRecordEdit,
    handleDeletePaymentRecord
  };
};
