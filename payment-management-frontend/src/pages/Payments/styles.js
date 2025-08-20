import dayjs from '../../utils/dayjs';

// 样式常量
export const paymentTableStyles = `
  .payment-records-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .payment-records-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .payment-records-table .ant-table-tbody > tr:hover > td {
    background-color: #f6ffed !important;
  }
  
  .payment-records-table .ant-table-pagination {
    margin: 16px 0 !important;
  }
  
  .payment-records-table .ant-table-pagination .ant-pagination-item {
    border-radius: 4px !important;
  }
  
  .payment-records-table .ant-table-pagination .ant-pagination-item-active {
    border-color: #1890ff !important;
    background-color: #1890ff !important;
  }
  
  .payment-records-table .ant-table-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  .payable-detail-modal .ant-tabs-tab {
    font-weight: 500 !important;
  }
  
  .payable-detail-modal .ant-tabs-tab-active {
    font-weight: bold !important;
  }
  
  .payment-record-card {
    transition: all 0.3s ease !important;
    border: 1px solid #f0f0f0 !important;
  }
  
  .payment-record-card:hover {
    border-color: #1890ff !important;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15) !important;
  }
  
  .payment-record-amount {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  }
  
  /* 查询表单样式 */
  .search-form .ant-form-item-label {
    text-align: left !important;
    line-height: 32px !important;
    margin-bottom: 4px !important;
  }
  
  .search-form .ant-form-item-label > label {
    height: 32px !important;
    line-height: 32px !important;
    font-weight: 500 !important;
    color: #333 !important;
  }
  
  .search-form .ant-form-item-control {
    line-height: 32px !important;
  }
  
  .search-form .ant-form-item {
    margin-bottom: 16px !important;
  }
  
  .search-form .ant-select,
  .search-form .ant-tree-select,
  .search-form .ant-input,
  .search-form .ant-picker {
    width: 100% !important;
  }
`;

// 表格列配置
export const getPayableColumns = (currencies, onViewDetail, onEdit, onAddPaymentRecord, onDelete) => [
  {
    title: '应付编号',
    dataIndex: 'PayableNumber',
    key: 'PayableNumber',
    width: 150,
  },
  {
    title: '应付说明',
    dataIndex: 'Description',
    key: 'Description',
    width: 240,
  },
  {
    title: '合同编号',
    dataIndex: 'ContractNumber',
    key: 'ContractNumber',
    width: 200,
    render: (value, record) => {
      const number = record.ContractNumber || value || '';
      const title = record.ContractTitle || record.Title || '';
      if (number && title) return `${number} - ${title}`;
      return number || title || '-';
    },
  },
  {
    title: '供应商',
    dataIndex: 'SupplierName',
    key: 'SupplierName',
    width: 150,
  },
  {
    title: '应付金额',
    dataIndex: 'PayableAmount',
    key: 'PayableAmount',
    width: 120,
    render: (value, record) => (
      <span>
        {record.CurrencySymbol || ''}{value ? value.toLocaleString() : '0'}
      </span>
    ),
  },
  {
    title: '已付金额',
    dataIndex: 'TotalPaidAmount',
    key: 'TotalPaidAmount',
    width: 120,
    render: (value, record) => (
      <span>
        {record.CurrencySymbol || ''}{parseFloat(value || 0).toLocaleString()}
      </span>
    ),
  },
  {
    title: '剩余金额',
    dataIndex: 'RemainingAmount',
    key: 'RemainingAmount',
    width: 120,
    render: (value, record) => (
      <span style={{ color: parseFloat(value) > 0 ? '#cf1322' : '#3f8600' }}>
        {record.CurrencySymbol || ''}{parseFloat(value || 0).toLocaleString()}
      </span>
    ),
  },
  {
    title: '付款截止日期',
    dataIndex: 'PaymentDueDate',
    key: 'PaymentDueDate',
    width: 120,
    render: (value) => {
      if (!value) return '-';
      // 直接使用数据库日期，不做时区处理
      return dayjs(value).format('YYYY-MM-DD');
    },
  },
  {
    title: '重要程度',
    dataIndex: 'Importance',
    key: 'Importance',
    width: 100,
    render: (value) => {
      const { getImportanceColor, getImportanceText } = require('./utils');
      return (
        <span style={{
          color: getImportanceColor(value),
          fontWeight: 'bold'
        }}>
          {getImportanceText(value)}
        </span>
      );
    },
  },
  {
    title: '紧急程度',
    dataIndex: 'Urgency',
    key: 'Urgency',
    width: 100,
    render: (value) => {
      const { getUrgencyColor, getUrgencyText } = require('./utils');
      return (
        <span style={{
          color: getUrgencyColor(value),
          fontWeight: 'bold'
        }}>
          {getUrgencyText(value)}
        </span>
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'Status',
    key: 'Status',
    width: 100,
    render: (value) => {
      const { getStatusColor, getStatusText } = require('./utils');
      return (
        <span style={{
          color: getStatusColor(value),
          fontWeight: 'bold'
        }}>
          {getStatusText(value)}
        </span>
      );
    },
  },
  {
    title: '备注',
    dataIndex: 'Notes',
    key: 'Notes',
    width: 240,
  },
  {
    title: '操作',
    key: 'action',
    width: 360,
    fixed: 'right',
    render: (_, record) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#1890ff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => onViewDetail(record)}
        >
          详情
        </button>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#1890ff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => onEdit(record)}
        >
          编辑
        </button>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#52c41a',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => onAddPaymentRecord(record.Id || record.id)}
        >
          新增付款
        </button>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4d4f',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => onDelete(record.Id || record.id)}
        >
          删除
        </button>
      </div>
    ),
  },
];

// 付款记录表格列配置
export const getPaymentRecordColumns = (currencies, onViewDetail, onEdit, onDelete) => [
  {
    title: '付款编号',
    dataIndex: 'PaymentNumber',
    key: 'PaymentNumber',
    width: 160,
    render: (value, item) => (
      <span style={{
        fontWeight: 'bold',
        color: '#1890ff',
        fontFamily: 'monospace'
      }}>
        {value || item.paymentNumber || '-'}
      </span>
    ),
  },
  {
    title: '付款说明',
    dataIndex: 'PaymentDescription',
    key: 'PaymentDescription',
    width: 240,
    ellipsis: true,
    render: (value, item) => (
      <span style={{ color: '#333' }}>
        {value || item.paymentDescription || '-'}
      </span>
    ),
  },
  {
    title: '付款金额',
    dataIndex: 'PaymentAmount',
    key: 'PaymentAmount',
    width: 140,
    align: 'right',
    render: (value, pr) => {
      const amount = value || pr.paymentAmount || 0;
      const currencySymbol = pr.CurrencySymbol || '';
      return (
        <span style={{
          fontWeight: 'bold',
          color: amount > 0 ? '#52c41a' : '#ff4d4f',
          fontSize: '14px'
        }}>
          {currencySymbol}{amount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      );
    },
  },
  {
    title: '币种',
    dataIndex: 'CurrencyCode',
    key: 'CurrencyCode',
    width: 120,
    align: 'center',
    render: (value, pr) => {
      const currency = currencies.find(c => c.Code === (value || pr.currencyCode));
      return currency ? (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {currency.Symbol} {currency.Name}
        </span>
      ) : (
        <span>{value || pr.currencyCode || '-'}</span>
      );
    }
  },
  {
    title: '付款日期',
    dataIndex: 'PaymentDate',
    key: 'PaymentDate',
    width: 140,
    align: 'center',
    render: (value, pr) => {
      const date = value || pr.paymentDate;
      if (!date) return '-';
      return new Date(date).toLocaleDateString('zh-CN');
    },
  },
  {
    title: '备注',
    dataIndex: 'Notes',
    key: 'Notes',
    width: 220,
    ellipsis: true,
    render: (value, pr) => {
      const notes = value || pr.notes;
      return notes || '暂无备注';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right',
    render: (_, pr) => {
      const recordId = pr.Id || pr.id;
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#1890ff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => onViewDetail(pr)}
          >
            详情
          </button>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#1890ff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => onEdit(pr)}
            disabled={!recordId}
          >
            编辑
          </button>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4d4f',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => onDelete(pr)}
            disabled={!recordId}
          >
            删除
          </button>
        </div>
      );
    }
  }
];
