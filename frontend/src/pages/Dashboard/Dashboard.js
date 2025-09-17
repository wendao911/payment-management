import React, { useEffect, useMemo } from 'react';
import { Row, Col, Divider, Typography } from 'antd';
import PaymentWarningSummary from '../../components/PaymentWarningSummary';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import BankAccountsSummary from './components/BankAccountsSummary';
import PayablesSummary from './components/PayablesSummary';
import PaymentRecordsSummary from './components/PaymentRecordsSummary';
import RecentPaymentsTable from './components/RecentPaymentsTable';
import ResizeObserverErrorBoundary from '../../components/ResizeObserverErrorBoundary';
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
    <ResizeObserverFix>
      <div>
      <Title level={1} className="text-2xl font-bold mb-6">系统概览</Title>

      {/* 付款预警统计 */}
      <ResizeObserverErrorBoundary>
        <PaymentWarningSummary onViewDetails={(type) => {
          // 跳转到付款管理页面并应用相应的过滤
          window.location.href = `#/payments?filter=${type}`;
        }} />
      </ResizeObserverErrorBoundary>

      <Divider />

      {/* 银行账户汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <ResizeObserverErrorBoundary>
            <BankAccountsSummary
              loading={bankLoading}
              bankSummary={bankSummary}
              maxBankTotalUsd={maxBankTotalUsd}
            />
          </ResizeObserverErrorBoundary>
        </Col>
      </Row>

      {/* 应付汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <ResizeObserverErrorBoundary>
            <PayablesSummary
              title="紧急和逾期应付汇总"
              loading={payablesLoading}
              dataSource={payablesSummary.payables}
              summary={payablesSummary.summary}
            />
          </ResizeObserverErrorBoundary>
        </Col>
      </Row>

      {/* 付款记录汇总 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <ResizeObserverErrorBoundary>
            <PaymentRecordsSummary
              loading={paymentsLoading}
              granularity={granularity}
              setGranularity={setGranularity}
              dateRange={dateRange}
              setDateRange={setDateRange}
              paymentSummary={paymentSummary}
            />
          </ResizeObserverErrorBoundary>
        </Col>
      </Row>

      {/* 最近付款记录 */}
      <Row gutter={16}>
        <Col span={24}>
          <ResizeObserverErrorBoundary>
            <RecentPaymentsTable
              loading={loading}
              dataSource={recentPayments}
            />
          </ResizeObserverErrorBoundary>
        </Col>
      </Row>
      </div>
    </ResizeObserverFix>
  );
};

export default Dashboard;
