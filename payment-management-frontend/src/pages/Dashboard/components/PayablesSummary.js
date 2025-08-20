import React from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { dashboardStyles } from '../styles';

const PayablesSummary = ({ title, loading, dataSource }) => {
  const columns = [
    { title: '应付编号', dataIndex: 'payableNumber' },
    { title: '供应商', dataIndex: 'supplierName' },
    { title: '合同编号', dataIndex: 'contractNumber' },
    { 
      title: '应付(USD)', 
      dataIndex: 'payableAmountUsd', 
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '已付(USD)', 
      dataIndex: 'totalPaidAmountUsd', 
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '剩余(USD)', 
      dataIndex: 'remainingAmountUsd', 
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '到期日', 
      dataIndex: 'paymentDueDate',
      render: (value) => {
        if (!value) return '-';
        // 直接使用数据库日期，不做时区处理
        return dayjs(value).format('YYYY-MM-DD');
      }
    },
  ];

  return (
    <>
      <style>{dashboardStyles}</style>
      <Card title={title} loading={loading} className="dashboard-card">
        <Table
          size="small"
          rowKey="id"
          pagination={{ pageSize: 5 }}
          dataSource={dataSource}
          columns={columns}
          className="dashboard-table"
        />
      </Card>
    </>
  );
};

export default PayablesSummary;
