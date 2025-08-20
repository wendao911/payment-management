import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import SafeTable from '../../../components/SafeTable';

const PaymentRecordsTable = ({ loading, dataSource, currencies, payables, onView }) => {
  const columns = [
    {
      title: '付款编号',
      dataIndex: 'PaymentNumber',
      key: 'PaymentNumber',
      width: 150,
      render: (value, record) => (
        <button
          type="button"
          onClick={() => onView(record)}
          style={{ padding: 0, background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
        >
          {value || record.paymentNumber || '-'}
        </button>
      ),
    },
    {
      title: '应付编号',
      dataIndex: 'payableManagementId',
      key: 'payableManagementId',
      width: 150,
      render: (value, record) => {
        if (record.PayableNumber) return record.PayableNumber;
        const payable = payables.find(p => (p.Id === value || p.id === value));
        return payable?.PayableNumber || payable?.payableNumber || '-';
      }
    },
    {
      title: '应付说明',
      dataIndex: 'Description',
      key: 'Description',
      width: 240,
      render: (value, record) => {
        if (record.Description) return record.Description;
        const payable = payables.find(p => (p.Id === record.payableManagementId || p.id === record.payableManagementId));
        return payable?.Description || payable?.description || '-';
      }
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
      key: 'paymentDescription',
      width: 240,
      ellipsis: true,
      render: (_, record) => record.PaymentDescription || record.paymentDescription || '-',
    },
    {
      title: '付款金额',
      key: 'paymentAmount',
      width: 140,
      render: (_, record) => {
        const amount = Number(record.PaymentAmount ?? record.paymentAmount ?? 0);
        const code = record.CurrencyCode || record.currencyCode;
        const symbol = record.CurrencySymbol || record.currencySymbol || (currencies.find(c => c.Code === code)?.Symbol) || '';
        return <span>{symbol}{amount.toLocaleString()}</span>;
      },
    },
    {
      title: '金额(USD)',
      key: 'AmountUSD',
      width: 120,
      render: (_, record) => {
        const upper = String(record.CurrencyCode || record.currencyCode || '').toUpperCase();
        const rate = upper === 'USD' ? 1 : upper === 'CNY' || upper === 'RMB' ? 7.2 : (currencies.find(c => (c.Code || '').toUpperCase() === upper)?.ExchangeRate ?? currencies.find(c => (c.Code || '').toUpperCase() === upper)?.exchangeRate ?? 1);
        const usd = Number(record.PaymentAmount || record.paymentAmount || 0) / (rate || 1);
        return <span>${usd.toFixed(2)}</span>;
      },
    },
    {
      title: '付款日期',
      key: 'paymentDate',
      width: 140,
      render: (_, record) => {
        const date = record.PaymentDate || record.paymentDate;
        if (!date) return '-';
        return dayjs(date).format('YYYY-MM-DD');
      },
    },
    {
      title: '备注',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.Notes || record.notes || '-',
    },
    {
      title: '附件数量',
      key: 'attachments',
      width: 100,
      render: (_, record) => {
        const attachmentCount = record.AttachmentCount ?? (record.attachments ? record.attachments.length : 0) ?? 0;
        return attachmentCount > 0 ? (
          <span style={{ color: '#1890ff' }}>{attachmentCount} 个</span>
        ) : (
          <span style={{ color: '#999' }}>无</span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <button
          type="button"
          onClick={() => onView(record)}
          style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <EyeOutlined /> 查看
        </button>
      ),
    },
  ];

  return (
    <SafeTable
      columns={columns}
      dataSource={dataSource}
      rowKey={(r) => r.Id || r.id}
      loading={loading}
      scroll={{ x: 1200 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        position: ['bottomCenter'],
        size: 'default'
      }}
      locale={{ emptyText: '暂无数据' }}
      size="middle"
      bordered={false}
      className="payment-record-table"
    />
  );
};

export default PaymentRecordsTable;
