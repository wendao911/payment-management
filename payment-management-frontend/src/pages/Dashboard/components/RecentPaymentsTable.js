import React from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { dashboardStyles } from '../styles';

const RecentPaymentsTable = ({ loading, dataSource }) => {
  const columns = [
    { 
      title: '付款编号', 
      dataIndex: 'PaymentNumber', 
      key: 'PaymentNumber', 
      width: 150,
      render: (value, record) => value || record.paymentNumber || '-' 
    },
    { 
      title: '应付编号', 
      dataIndex: 'PayableNumber', 
      key: 'PayableNumber', 
      width: 150,
      render: (value, record) => value || record.payableNumber || '-' 
    },
    { 
      title: '应付说明', 
      dataIndex: 'Description', 
      key: 'Description', 
      width: 240,
      render: (value, record) => value || record.description || '-' 
    },
    { 
      title: '合同编号', 
      dataIndex: 'ContractNumber', 
      key: 'ContractNumber', 
      width: 220,
      render: (value, record) => {
        const number = record.ContractNumber || value || record.contractNumber || '';
        const title = record.ContractTitle || record.Title || '';
        if (number && title) return `${number} - ${title}`;
        return number || title || '-';
      }
    },
    { 
      title: '供应商', 
      dataIndex: 'SupplierName', 
      key: 'SupplierName', 
      width: 160,
      render: (value, record) => value || record.supplierName || '-' 
    },
    { 
      title: '付款说明', 
      dataIndex: 'PaymentDescription', 
      key: 'PaymentDescription', 
      width: 240,
      render: (value, record) => value || record.paymentDescription || '-' 
    },
    { 
      title: '付款金额', 
      dataIndex: 'PaymentAmount', 
      key: 'PaymentAmount', 
      width: 140,
      render: (value, record) => {
        const amount = Number(value ?? record.paymentAmount ?? 0);
        const symbol = record.CurrencySymbol || record.currencySymbol || '';
        return `${symbol}${amount.toLocaleString()}`;
      }
    },
    { 
      title: '付款日期', 
      dataIndex: 'PaymentDate', 
      key: 'PaymentDate', 
      width: 140,
      render: (value, record) => dayjs(value || record.paymentDate).format('YYYY-MM-DD') 
    },
    { 
      title: '备注', 
      dataIndex: 'Notes', 
      key: 'Notes', 
      width: 200,
      render: (value, record) => value || record.notes || '-' 
    },
    { 
      title: '附件数量', 
      dataIndex: 'AttachmentCount', 
      key: 'AttachmentCount', 
      width: 100,
      render: (value, record) => {
        const count = value ?? (record.attachments ? record.attachments.length : 0) ?? 0;
        return count > 0 ? 
          <span style={{ color: '#1890ff' }}>{count} 个</span> : 
          <span style={{ color: '#999' }}>无</span>;
      }
    }
  ];

  return (
    <>
      <style>{dashboardStyles}</style>
      <Card title="最近付款记录" loading={loading} className="dashboard-card">
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          pagination={false}
          size="small"
          className="dashboard-table"
        />
      </Card>
    </>
  );
};

export default RecentPaymentsTable;
