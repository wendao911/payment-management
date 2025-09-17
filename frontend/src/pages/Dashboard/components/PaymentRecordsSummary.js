import React from 'react';
import { Card, Space, Spin, Typography, Row, Col, Table, Radio, DatePicker } from 'antd';
import { dashboardStyles } from '../styles';
import ResizeObserverFix from '../../../components/ResizeObserverFix';

const { Title, Text } = Typography;

const PaymentRecordsSummary = ({ 
  loading, 
  granularity, 
  setGranularity, 
  dateRange, 
  setDateRange, 
  paymentSummary 
}) => {
  return (
    <>
      <style>{dashboardStyles}</style>
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
        className="dashboard-card"
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <Text strong>时间范围总计：</Text>
              <Text> ${Number(paymentSummary.totalPaidUsd || 0).toLocaleString()}</Text>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>按应付汇总</Title>
                <ResizeObserverFix>
                <Table
                  size="small"
                  rowKey="payableId"
                  pagination={{ pageSize: 5 }}
                  dataSource={paymentSummary.groupedByPayable}
                  columns={[
                    { title: '应付编号', dataIndex: 'payableNumber' },
                    { 
                      title: '本期合计(USD)', 
                      dataIndex: 'sumInRangeUsd', 
                      render: v => `$${Number(v || 0).toLocaleString()}` 
                    },
                    { 
                      title: '累计合计(USD)', 
                      dataIndex: 'sumAllTimeUsd', 
                      render: v => `$${Number(v || 0).toLocaleString()}` 
                    },
                  ]}
                  className="dashboard-table"
                />
                </ResizeObserverFix>
              </Col>
              <Col span={12}>
                <Title level={5}>时间序列（{granularity === 'day' ? '日' : granularity === 'month' ? '月' : '年'}）</Title>
                <ResizeObserverFix>
                <Table
                  size="small"
                  rowKey={(r) => r.period}
                  pagination={{ pageSize: 6 }}
                  dataSource={paymentSummary.timeseries}
                  columns={[
                    { title: '期间', dataIndex: 'period' },
                    { 
                      title: '总计(USD)', 
                      dataIndex: 'totalUsd', 
                      render: v => `$${Number(v || 0).toLocaleString()}` 
                    },
                  ]}
                  className="dashboard-table"
                />
                </ResizeObserverFix>
              </Col>
            </Row>
          </>
        )}
      </Card>
    </>
  );
};

export default PaymentRecordsSummary;
