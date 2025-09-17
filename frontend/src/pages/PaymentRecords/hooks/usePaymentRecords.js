import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';
import { message } from 'antd';

export const usePaymentRecords = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payables, setPayables] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contractTreeData, setContractTreeData] = useState([]);

  const fetchPaymentRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment-records');
      if (response.success) {
        setPaymentRecords(response.data || []);
        setFilteredRecords(response.data || []);
      } else {
        setPaymentRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
      setPaymentRecords([]);
      setFilteredRecords([]);
    }
    setLoading(false);
  }, []);

  const fetchPayables = useCallback(async () => {
    try {
      const response = await apiClient.get('/payment');
      if (response.success) {
        setPayables(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
    }
  }, []);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await apiClient.get('/payment/currencies/list');
      if (response.success) {
        setCurrencies(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const contractsData = response.data || [];
        const convertToTreeSelectFormat = (list) =>
          list.map(c => ({
            title: `${c.ContractNumber} - ${c.Title || '无标题'}`,
            value: c.Id,
            key: c.Id,
            children: c.children ? convertToTreeSelectFormat(c.children) : []
          }));
        setContractTreeData(convertToTreeSelectFormat(contractsData));
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.paymentNumber) params.append('paymentNumber', values.paymentNumber);
      if (values.payableManagementId) params.append('payableManagementId', values.payableManagementId);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.contractId) params.append('contractId', values.contractId);
      if (values.paymentDateRange && values.paymentDateRange.length === 2) {
        params.append('startDate', values.paymentDateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.paymentDateRange[1].format('YYYY-MM-DD'));
      }

      const response = await apiClient.get(`/payment-records?${params.toString()}`);
      if (response.success) {
        setFilteredRecords(response.data || []);
      } else {
        message.error(response.message || '查询失败');
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error searching payment records:', error);
      message.error('查询失败');
      setFilteredRecords([]);
    }
    setLoading(false);
  }, []);

  const fetchRecordDetail = useCallback(async (record) => {
    try {
      const id = record.Id || record.id;
      if (!id) {
        return record;
      }
      const response = await apiClient.get(`/payment-records/detail/${id}`);
      if (response.success) {
        return response.data || record;
      }
      return record;
    } catch (e) {
      console.warn('获取付款记录详情失败，使用现有数据');
      return record;
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    await Promise.all([
      fetchPaymentRecords(),
      fetchPayables(),
      fetchCurrencies(),
      fetchSuppliers(),
      fetchContracts(),
    ]);
  }, [fetchPaymentRecords, fetchPayables, fetchCurrencies, fetchSuppliers, fetchContracts]);

  return {
    paymentRecords,
    filteredRecords,
    loading,
    payables,
    currencies,
    suppliers,
    contractTreeData,
    fetchInitialData,
    fetchPaymentRecords,
    handleSearch,
    fetchRecordDetail,
  };
};
