import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/api';

export const useDashboard = () => {
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 银行账户汇总（美元）
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSummary, setBankSummary] = useState({ 
    items: [], 
    aggregate: { totalUsd: 0, availableUsd: 0, unavailableUsd: 0 } 
  });

  // 应付（紧急/逾期）
  const [payablesLoading, setPayablesLoading] = useState(false);
  const [payablesSummary, setPayablesSummary] = useState({ urgent: [], overdue: [] });

  // 付款记录汇总（按日/月/年筛选）
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [granularity, setGranularity] = useState('month');
  const [dateRange, setDateRange] = useState([dayjs().add(-30, 'day'), dayjs()]);
  const [paymentSummary, setPaymentSummary] = useState({
    range: { start: '', end: '' },
    totalPaidUsd: 0,
    payments: [],
    groupedByPayable: [],
    timeseries: [],
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // 获取最近付款记录（与付款记录列表结构一致）
      const paymentsRes = await apiClient.get('/payment-records', {
        params: { page: 1, pageSize: 5 }
      });
      const list = paymentsRes.success ? (paymentsRes.data || []) : [];
      setRecentPayments(list);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRecentPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBankAccountsSummary = useCallback(async () => {
    setBankLoading(true);
    try {
      const res = await apiClient.get('/dashboard/bank-accounts/summary');
      if (res.success) {
        setBankSummary(res.data || { 
          items: [], 
          aggregate: { totalUsd: 0, availableUsd: 0, unavailableUsd: 0 } 
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setBankLoading(false);
    }
  }, []);

  const fetchPayablesSummary = useCallback(async () => {
    setPayablesLoading(true);
    try {
      const res = await apiClient.get('/dashboard/payables/summary');
      if (res.success) {
        setPayablesSummary(res.data || { urgent: [], overdue: [] });
      }
    } catch (e) {
      // ignore
    } finally {
      setPayablesLoading(false);
    }
  }, []);

  const fetchPaymentRecordsSummary = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const start = dateRange?.[0]?.format('YYYY-MM-DD');
      const end = dateRange?.[1]?.format('YYYY-MM-DD');
      const res = await apiClient.get(`/dashboard/payment-records/summary`, {
        params: {
          startDate: start,
          endDate: end,
          granularity,
        }
      });
      if (res.success) {
        setPaymentSummary(res.data || { 
          range: { start, end }, 
          totalPaidUsd: 0, 
          payments: [], 
          groupedByPayable: [], 
          timeseries: [] 
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setPaymentsLoading(false);
    }
  }, [granularity, dateRange]);

  return {
    recentPayments,
    loading,
    bankLoading,
    bankSummary,
    payablesLoading,
    payablesSummary,
    paymentsLoading,
    granularity,
    setGranularity,
    dateRange,
    setDateRange,
    paymentSummary,
    fetchDashboardData,
    fetchBankAccountsSummary,
    fetchPayablesSummary,
    fetchPaymentRecordsSummary
  };
};
