import React, { useEffect, useMemo } from 'react';
import { Row, Col, Divider, Typography } from 'antd';
import PaymentWarningSummary from '../../components/PaymentWarningSummary';
import BankAccountsSummary from './components/BankAccountsSummary';
import PayablesSummary from './components/PayablesSummary';
import PaymentRecordsSummary from './components/PaymentRecordsSummary';
import RecentPaymentsTable from './components/RecentPaymentsTable';
import { useDashboard } from './hooks/useDashboard';

const { Title } = Typography;

const Dashboard = () => {
  const {
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
  } = useDashboard();

  const maxBankTotalUsd = useMemo(() => {
    return Math.max(1, ...bankSummary.items.map(i => Number(i.totalUsd || 0)));
  }, [bankSummary]);

  useEffect(() => {
    fetchDashboardData();
    fetchBankAccountsSummary();
    fetchPayablesSummary();
  }, [fetchDashboardData, fetchBankAccountsSummary, fetchPayablesSummary]);

  useEffect(() => {
    fetchPaymentRecordsSummary();
  }, [fetchPaymentRecordsSummary, granularity, dateRange]);

  return (
    <div>
      <Title level={1} className="text-2xl font-bold mb-6">系统概览</Title>

      {/* 付款预警统计 */}
      <PaymentWarningSummary onViewDetails={(type) => {
        // 跳转到付款管理页面并应用相应的过滤
        window.location.href = `#/payments?filter=${type}`;
      }} />

      <Divider />

      {/* 银行账户汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <BankAccountsSummary
            loading={bankLoading}
            bankSummary={bankSummary}
            maxBankTotalUsd={maxBankTotalUsd}
          />
        </Col>
      </Row>

      {/* 应付汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <PayablesSummary
            title="紧急应付"
            loading={payablesLoading}
            dataSource={payablesSummary.urgent}
          />
        </Col>
        <Col span={12}>
          <PayablesSummary
            title="逾期应付"
            loading={payablesLoading}
            dataSource={payablesSummary.overdue}
          />
        </Col>
      </Row>

      {/* 付款记录汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <PaymentRecordsSummary
            loading={paymentsLoading}
            granularity={granularity}
            setGranularity={setGranularity}
            dateRange={dateRange}
            setDateRange={setDateRange}
            paymentSummary={paymentSummary}
          />
        </Col>
      </Row>

      {/* 最近付款记录 */}
      <Row gutter={16}>
        <Col span={24}>
          <RecentPaymentsTable
            loading={loading}
            dataSource={recentPayments}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
