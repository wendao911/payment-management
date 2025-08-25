import React, { useMemo, useCallback } from 'react';
import { Card, Table, Tag } from 'antd';
import dayjs from '../../../utils/dayjs';
import { dashboardStyles } from '../styles';

// 使用 React.memo 包装组件，避免不必要的重新渲染
const PayablesSummary = React.memo(({ title, loading, dataSource, summary }) => {
  // 使用 useMemo 缓存列定义，避免每次渲染都重新创建
  const columns = useMemo(() => [
    { 
      title: '状态', 
      dataIndex: 'warningStatus',
      width: 80,
      render: (status) => {
        if (status === 'urgent') {
          return <Tag color="orange">紧急</Tag>;
        } else if (status === 'overdue') {
          return <Tag color="red">逾期</Tag>;
        }
        return <Tag color="default">正常</Tag>;
      }
    },
    { title: '应付编号', dataIndex: 'payableNumber', width: 120 },
    { title: '应付说明', dataIndex: 'payableDescription', width: 150, ellipsis: true },
    { title: '供应商', dataIndex: 'supplierName', width: 120, ellipsis: true },
    { title: '合同编号', dataIndex: 'contractDisplay', width: 200, ellipsis: true },
    { 
      title: '应付金额', 
      dataIndex: 'payableAmountDisplay',
      width: 120
    },
    { 
      title: '应付金额(USD)', 
      dataIndex: 'payableAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '已付金额(USD)', 
      dataIndex: 'totalPaidAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '剩余金额(USD)', 
      dataIndex: 'remainingAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '到期日', 
      dataIndex: 'paymentDueDate',
      width: 100,
      render: (value) => {
        if (!value) return '-';
        // 直接使用数据库日期，不做时区处理
        return dayjs(value).format('YYYY-MM-DD');
      }
    },
  ], []);

  // 使用 useCallback 缓存行样式函数
  const getRowClassName = useCallback((record) => {
    if (record.warningStatus === 'urgent') return 'urgent-row';
    if (record.warningStatus === 'overdue') return 'overdue-row';
    return '';
  }, []);

  // 使用 useMemo 缓存统计摘要
  const summaryExtra = useMemo(() => {
    if (!summary) return null;
    return (
      <div style={{ fontSize: '12px', color: '#666' }}>
        紧急: {summary.urgent.count}项 (${summary.urgent.totalUsd.toLocaleString()}) | 
        逾期: {summary.overdue.count}项 (${summary.overdue.totalUsd.toLocaleString()})
      </div>
    );
  }, [summary]);

  // 确保数据源是有效的数组
  const validDataSource = Array.isArray(dataSource) ? dataSource : [];

  return (
    <>
      <style>{dashboardStyles}</style>
      <Card 
        title={title} 
        loading={loading} 
        className="dashboard-card"
        extra={summaryExtra}
      >
        <Table
          size="small"
          rowKey="id"
          pagination={{ pageSize: 10 }}
          dataSource={validDataSource}
          columns={columns}
          className="dashboard-table"
          // 简化滚动配置
          scroll={{ x: 'max-content' }}
          rowClassName={getRowClassName}
          bordered={false}
          showHeader={true}
        />
      </Card>
    </>
  );
});

// 设置显示名称，便于调试
PayablesSummary.displayName = 'PayablesSummary';

export default PayablesSummary;
