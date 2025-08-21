import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { getPayableColumns, getPaymentRecordColumns } from '../styles';

const PaymentsTable = ({
  payables,
  loading,
  currencies,
  onViewDetail,
  onEdit,
  onDelete,
  onAddPaymentRecord,
  onViewPaymentRecord,
  onEditPaymentRecord,
  onDeletePaymentRecord
}) => {
  // 表格列配置
  const payableColumns = getPayableColumns(
    currencies,
    onViewDetail,
    onEdit,
    onAddPaymentRecord,
    onDelete
  );

  const paymentRecordColumns = getPaymentRecordColumns(
    currencies,
    onViewPaymentRecord,
    onEditPaymentRecord,
    onDeletePaymentRecord
  );

  return (
    <Table
      columns={payableColumns}
      dataSource={payables}
      rowKey="Id"
      loading={loading}
      scroll={{ x: 1500 }}
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
      expandable={{
        expandedRowRender: (record) => (
          <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>付款记录</h4>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onAddPaymentRecord(record.Id || record.id)}
              >
                新增付款记录
              </Button>
            </div>
            {record.paymentRecords && record.paymentRecords.length > 0 ? (
              <Table
                className="payment-records-table"
                columns={paymentRecordColumns}
                dataSource={record.paymentRecords}
                rowKey={(pr) => `payment-${pr.Id || pr.id}`}
                size="small"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                  position: ['bottomCenter'],
                  size: 'small'
                }}
                bordered={false}
                scroll={{ x: 1200 }}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '40px',
                backgroundColor: 'white',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无付款记录</div>
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                  点击"新增付款记录"按钮创建第一条付款记录
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => onAddPaymentRecord(record.Id || record.id)}
                >
                  新增付款记录
                </Button>
              </div>
            )}
          </div>
        ),
        rowExpandable: (record) => true,
      }}
    />
  );
};

export default PaymentsTable;
