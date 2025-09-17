import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getCurrencySymbol, getAccountTypeText, getAccountTypeColor } from '../utils/helpers';
import BalanceExpandedRow from './BalanceExpandedRow';

const BankAccountsTable = ({
  accounts,
  loading,
  onEdit,
  onDelete,
  onAddBalance,
  onEditBalance,
  onDeleteBalance,
  currencies
}) => {
  const columns = [
    {
      title: '银行名称',
      dataIndex: 'BankName',
      key: 'account-bank-name',
      width: 150,
      render: (value, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.children && record.children.length > 0 && (
            <span style={{ 
              marginRight: '8px', 
              color: '#1890ff', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              🏦
            </span>
          )}
          <span style={{ 
            fontWeight: 'bold',
            color: record.children && record.children.length > 0 ? '#1890ff' : '#333'
          }}>
            {value}
          </span>
        </div>
      ),
    },
    {
      title: '账户号码',
      dataIndex: 'AccountNumber',
      key: 'account-number',
      width: 180,
      render: (value, record) => (
        <span style={{ 
          fontWeight: record.children && record.children.length > 0 ? 'bold' : 'normal',
          color: record.children && record.children.length > 0 ? '#1890ff' : '#333',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          {value}
        </span>
      ),
    },
    {
      title: '账户名称',
      dataIndex: 'AccountName',
      key: 'account-name',
      width: 150,
    },
    {
      title: '账户类型',
      dataIndex: 'AccountType',
      key: 'account-type',
      width: 120,
      render: (value) => (
        <Tag color={getAccountTypeColor(value)}>
          {getAccountTypeText(value)}
        </Tag>
      )
    },
    {
      title: '币种',
      dataIndex: 'CurrencyCode',
      key: 'account-currency',
      width: 80,
      align: 'center',
      render: (value) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {value}
        </Tag>
      ),
    },
    {
      title: '当前余额',
      key: 'current-balance',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const currentBalance = record.CurrentBalance || 0;
        const latestBalance = record.latestBalance || currentBalance;
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: latestBalance > 0 ? '#52c41a' : latestBalance < 0 ? '#ff4d4f' : '#666'
            }}>
              {latestBalance.toLocaleString('zh-CN', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })} {getCurrencySymbol(record.CurrencyCode, currencies)}
            </div>
            {record.children && record.children.length > 0 && (
              <div style={{ 
                fontSize: '11px', 
                color: '#999',
                marginTop: '2px'
              }}>
                {record.balanceCount} 条记录
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '最后更新',
      key: 'last-updated',
      width: 150,
      render: (_, record) => {
        const lastUpdate = record.latestBalanceDate || record.UpdatedAt || record.CreatedAt;
        return (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {lastUpdate ? new Date(lastUpdate).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) : '-'}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'account-status',
      width: 80,
      align: 'center',
      render: (value) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'account-actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        // 如果是余额记录（子节点），不显示操作按钮
        if (record.BankAccountId) {
          return null;
        }
        
        // 如果是银行账户（父节点），显示账户操作
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              style={{ padding: '4px 8px' }}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => onAddBalance(record)}
              style={{ padding: '4px 8px' }}
            >
              添加金额
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.Id)}
              style={{ padding: '4px 8px' }}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  const renderExpandedRow = (record) => {
    if (record.children && record.children.length > 0) {
      return (
        <BalanceExpandedRow
          record={record}
          currencies={currencies}
          onAddBalance={onAddBalance}
          onEditBalance={onEditBalance}
          onDeleteBalance={onDeleteBalance}
        />
      );
    }
    return null;
  };

  return (
    <Table
      columns={columns}
      dataSource={accounts}
      rowKey="Id"
      loading={loading}
      expandable={{
        expandedRowRender: (record) => renderExpandedRow(record),
        rowExpandable: (record) => record.children && record.children.length > 0,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        position: ['bottomCenter'],
        size: 'default'
      }}
      locale={{
        emptyText: '暂无数据'
      }}
      size="middle"
      bordered={false}
      className="bank-account-table"
      scroll={{ x: 1500 }}
    />
  );
};

export default BankAccountsTable;
