import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Space, Typography, Divider, DatePicker, Radio, Spin, Empty } from 'antd';
import { } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { apiClient } from '../utils/api';

const Dashboard = () => {
  // 移除统计卡片
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 新增：银行账户汇总（美元）
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSummary, setBankSummary] = useState({ items: [], aggregate: { totalUsd: 0, availableUsd: 0, unavailableUsd: 0 } });

  // 新增：应付（紧急/逾期）
  const [payablesLoading, setPayablesLoading] = useState(false);
  const [payablesSummary, setPayablesSummary] = useState({ urgent: [], overdue: [] });

  // 新增：付款记录汇总（按日/月/年筛选）
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

  useEffect(() => {
    fetchDashboardData();
    fetchBankAccountsSummary();
    fetchPayablesSummary();
  }, []);

  useEffect(() => {
    fetchPaymentRecordsSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, dateRange]);

  const fetchDashboardData = async () => {
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
  };

  const fetchBankAccountsSummary = async () => {
    setBankLoading(true);
    try {
      const res = await apiClient.get('/dashboard/bank-accounts/summary');
      if (res.success) {
        setBankSummary(res.data || { items: [], aggregate: { totalUsd: 0, availableUsd: 0, unavailableUsd: 0 } });
      }
    } catch (e) {
      // ignore
    } finally {
      setBankLoading(false);
    }
  };

  const fetchPayablesSummary = async () => {
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
  };

  const fetchPaymentRecordsSummary = async () => {
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
        setPaymentSummary(res.data || { range: { start, end }, totalPaidUsd: 0, payments: [], groupedByPayable: [], timeseries: [] });
      }
    } catch (e) {
      // ignore
    } finally {
      setPaymentsLoading(false);
    }
  };

  const maxBankTotalUsd = useMemo(() => {
    return Math.max(1, ...bankSummary.items.map(i => Number(i.totalUsd || 0)));
  }, [bankSummary]);

  const columns = [
    { title: '付款编号', dataIndex: 'PaymentNumber', key: 'PaymentNumber', width: 150,
      render: (value, record) => value || record.paymentNumber || '-' },
    { title: '应付编号', dataIndex: 'PayableNumber', key: 'PayableNumber', width: 150,
      render: (value, record) => value || record.payableNumber || '-' },
    { title: '应付说明', dataIndex: 'Description', key: 'Description', width: 240,
      render: (value, record) => value || record.description || '-' },
    { title: '合同编号', dataIndex: 'ContractNumber', key: 'ContractNumber', width: 220,
      render: (value, record) => {
        const number = record.ContractNumber || value || record.contractNumber || '';
        const title = record.ContractTitle || record.Title || '';
        if (number && title) return `${number} - ${title}`;
        return number || title || '-';
      }
    },
    { title: '供应商', dataIndex: 'SupplierName', key: 'SupplierName', width: 160,
      render: (value, record) => value || record.supplierName || '-' },
    { title: '付款说明', dataIndex: 'PaymentDescription', key: 'PaymentDescription', width: 240,
      render: (value, record) => value || record.paymentDescription || '-' },
    { title: '付款金额', dataIndex: 'PaymentAmount', key: 'PaymentAmount', width: 140,
      render: (value, record) => {
        const amount = Number(value ?? record.paymentAmount ?? 0);
        const symbol = record.CurrencySymbol || record.currencySymbol || '';
        return `${symbol}${amount.toLocaleString()}`;
      }
    },
    { title: '付款日期', dataIndex: 'PaymentDate', key: 'PaymentDate', width: 140,
      render: (value, record) => dayjs(value || record.paymentDate).format('YYYY-MM-DD') },
    { title: '备注', dataIndex: 'Notes', key: 'Notes', width: 200,
      render: (value, record) => value || record.notes || '-' },
    { title: '附件数量', dataIndex: 'AttachmentCount', key: 'AttachmentCount', width: 100,
      render: (value, record) => {
        const count = value ?? (record.attachments ? record.attachments.length : 0) ?? 0;
        return count > 0 ? <span style={{ color: '#1890ff' }}>{count} 个</span> : <span style={{ color: '#999' }}>无</span>;
      }
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">系统概览</h1>
      
      {/* 统计卡片已移除 */}

      <Divider />

      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card title="银行账户（统一美元）" extra={<span>总余额：${bankSummary.aggregate.totalUsd?.toLocaleString?.() || 0}，可用：${bankSummary.aggregate.availableUsd?.toLocaleString?.() || 0}，不可用：${bankSummary.aggregate.unavailableUsd?.toLocaleString?.() || 0}</span>}>
            {bankLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
            ) : bankSummary.items.length === 0 ? (
              <Empty description="暂无账户" />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {bankSummary.items.map(item => {
                  const widthScale = Math.max(0.1, Number(item.totalUsd || 0) / maxBankTotalUsd);
                  const availablePct = item.totalUsd > 0 ? (Number(item.availableUsd || 0) / Number(item.totalUsd || 1)) : 0;
                  const unavailablePct = 1 - availablePct;
                  return (
                    <div key={item.accountId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Space size={8}>
                          <Typography.Text strong>{item.accountName}</Typography.Text>
                          <Typography.Text type="secondary">{item.bankName}</Typography.Text>
                          <Typography.Text type="secondary">{item.currencyCode}</Typography.Text>
                        </Space>
                        <Space size={16}>
                          <Typography.Text>总额 ${Number(item.totalUsd || 0).toLocaleString()}</Typography.Text>
                          <Typography.Text type="success">可用 ${Number(item.availableUsd || 0).toLocaleString()}</Typography.Text>
                          <Typography.Text type="secondary">不可用 ${Number(item.unavailableUsd || 0).toLocaleString()}</Typography.Text>
                        </Space>
                      </div>
                      <div style={{ width: `${Math.min(100, widthScale * 100)}%`, height: 14, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${availablePct * 100}%`, height: '100%', background: '#52c41a', display: 'inline-block' }} />
                        <div style={{ width: `${unavailablePct * 100}%`, height: '100%', background: '#bfbfbf', display: 'inline-block' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="紧急应付" loading={payablesLoading}>
            <Table
              size="small"
              rowKey="id"
              pagination={{ pageSize: 5 }}
              dataSource={payablesSummary.urgent}
              columns={[
                { title: '应付编号', dataIndex: 'payableNumber' },
                { title: '供应商', dataIndex: 'supplierName' },
                { title: '合同编号', dataIndex: 'contractNumber' },
                { title: '应付(USD)', dataIndex: 'payableAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '已付(USD)', dataIndex: 'totalPaidAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '剩余(USD)', dataIndex: 'remainingAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '到期日', dataIndex: 'paymentDueDate' },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="逾期应付" loading={payablesLoading}>
            <Table
              size="small"
              rowKey="id"
              pagination={{ pageSize: 5 }}
              dataSource={payablesSummary.overdue}
              columns={[
                { title: '应付编号', dataIndex: 'payableNumber' },
                { title: '供应商', dataIndex: 'supplierName' },
                { title: '合同编号', dataIndex: 'contractNumber' },
                { title: '应付(USD)', dataIndex: 'payableAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '已付(USD)', dataIndex: 'totalPaidAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '剩余(USD)', dataIndex: 'remainingAmountUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                { title: '到期日', dataIndex: 'paymentDueDate' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card
            title="付款记录汇总（USD）"
            extra={
              <Space>
                <Radio.Group value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                  <Radio.Button value="day">按日</Radio.Button>
                  <Radio.Button value="month">按月</Radio.Button>
                  <Radio.Button value="year">按年</Radio.Button>
                </Radio.Group>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
                  allowClear={false}
                />
              </Space>
            }
          >
            {paymentsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Typography.Text strong>时间范围总计：</Typography.Text>
                  <Typography.Text> ${Number(paymentSummary.totalPaidUsd || 0).toLocaleString()}</Typography.Text>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Typography.Title level={5}>按应付汇总</Typography.Title>
                    <Table
                      size="small"
                      rowKey="payableId"
                      pagination={{ pageSize: 5 }}
                      dataSource={paymentSummary.groupedByPayable}
                      columns={[
                        { title: '应付编号', dataIndex: 'payableNumber' },
                        { title: '本期合计(USD)', dataIndex: 'sumInRangeUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                        { title: '累计合计(USD)', dataIndex: 'sumAllTimeUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <Typography.Title level={5}>时间序列（{granularity === 'day' ? '日' : granularity === 'month' ? '月' : '年'}）</Typography.Title>
                    <Table
                      size="small"
                      rowKey={(r) => r.period}
                      pagination={{ pageSize: 6 }}
                      dataSource={paymentSummary.timeseries}
                      columns={[
                        { title: '期间', dataIndex: 'period' },
                        { title: '总计(USD)', dataIndex: 'totalUsd', render: v => `$${Number(v || 0).toLocaleString()}` },
                      ]}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="最近付款记录" loading={loading}>
            <Table
              columns={columns}
              dataSource={recentPayments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
