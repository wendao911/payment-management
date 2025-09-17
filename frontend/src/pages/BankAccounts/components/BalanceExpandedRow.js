import React from 'react';
import { Table, Button, Tag, Space, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { getCurrencySymbol } from '../utils/helpers';

const BalanceExpandedRow = ({
  record,
  currencies,
  onAddBalance,
  onEditBalance,
  onDeleteBalance
}) => {
  const balanceColumns = [
    {
      title: '账户金额',
      dataIndex: 'Balance',
      key: 'balance-amount',
      width: 130,
      align: 'right',
      render: (value, balanceRecord) => {
        // 获取对应的账户信息以显示币种符号
        const account = record;
        const currencySymbol = account ? getCurrencySymbol(account.CurrencyCode, currencies) : '';
        
        return (
          <span style={{ 
            fontWeight: 'bold', 
            color: value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#666',
            fontSize: '14px'
          }}>
            {value ? value.toLocaleString('zh-CN', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            }) : '0.00'} {currencySymbol}
          </span>
        );
      },
    },
    {
      title: '金额状态',
      dataIndex: 'BalanceStatus',
      key: 'balance-status',
      width: 100,
      align: 'center',
      render: (value) => {
        const statusMap = {
          'Available': { text: '可用', color: 'green' },
          'Unavailable': { text: '不可用', color: 'red' },
          'Pending': { text: '待确认', color: 'orange' },
          'Frozen': { text: '冻结', color: 'blue' }
        };
        const status = statusMap[value] || { text: value, color: 'default' };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'Notes',
      key: 'balance-notes',
      width: 180,
      render: (value) => (
        <span style={{ 
          color: value ? '#333' : '#999',
          fontStyle: value ? 'normal' : 'italic'
        }}>
          {value || '暂无备注'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'CreatedAt',
      key: 'balance-created',
      width: 140,
      render: (value) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {new Date(value).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'UpdatedAt',
      key: 'balance-updated',
      width: 140,
      render: (value) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {value ? new Date(value).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'balance-actions',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, balanceRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditBalance(balanceRecord)}
            style={{ padding: '4px 8px' }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: '余额记录详情',
                width: 600,
                content: (
                  <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>账户金额：</strong>
                      <span style={{ 
                        color: balanceRecord.Balance > 0 ? '#52c41a' : '#ff4d4f',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {balanceRecord.Balance?.toLocaleString('zh-CN', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} {getCurrencySymbol(record.CurrencyCode, currencies)}
                      </span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>金额状态：</strong>
                      <Tag color={
                        balanceRecord.BalanceStatus === 'Available' ? 'green' :
                        balanceRecord.BalanceStatus === 'Unavailable' ? 'red' :
                        balanceRecord.BalanceStatus === 'Pending' ? 'orange' : 'blue'
                      }>
                        {balanceRecord.BalanceStatus === 'Available' ? '可用' :
                         balanceRecord.BalanceStatus === 'Unavailable' ? '不可用' :
                         balanceRecord.BalanceStatus === 'Pending' ? '待确认' : '冻结'}
                      </Tag>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>创建时间：</strong>
                      <div>{new Date(balanceRecord.CreatedAt).toLocaleString('zh-CN')}</div>
                    </div>
                    {balanceRecord.UpdatedAt && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong>更新时间：</strong>
                        <div>{new Date(balanceRecord.UpdatedAt).toLocaleString('zh-CN')}</div>
                      </div>
                    )}
                    {balanceRecord.Notes && (
                      <div style={{ marginTop: '16px' }}>
                        <strong>备注信息：</strong>
                        <div style={{ 
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9'
                        }}>
                          {balanceRecord.Notes}
                        </div>
                      </div>
                    )}
                  </div>
                ),
                okText: '关闭'
              });
            }}
            style={{ padding: '4px 8px' }}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteBalance(balanceRecord.Id)}
            style={{ padding: '4px 8px' }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
      {/* 标题和操作按钮 */}
      <div style={{ 
        marginBottom: '12px', 
        fontWeight: 'bold', 
        color: '#1890ff',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 账户金额记录列表
          <span style={{ 
            fontSize: '12px', 
            color: '#666', 
            fontWeight: 'normal' 
          }}>
            (共 {record.children.length} 条记录)
          </span>
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onAddBalance(record)}
        >
          添加金额记录
        </Button>
      </div>

      {/* 余额记录表格 */}
      {record.children.length > 0 ? (
        <Table
          columns={balanceColumns}
          dataSource={record.children}
          rowKey={(balanceRecord) => `balance-${balanceRecord.Id}`}
          size="small"
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          bordered
          style={{ backgroundColor: 'white' }}
          rowClassName="balance-table-row"
          className="balance-sub-table"
          scroll={{ x: 900 }}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          color: '#666'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无账户金额记录</div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            点击"添加金额记录"按钮创建第一条账户金额记录
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onAddBalance(record)}
          >
            添加金额记录
          </Button>
        </div>
      )}
    </div>
  );
};

export default BalanceExpandedRow;
