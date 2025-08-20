import React from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const SuppliersTable = ({
  suppliers,
  loading,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: '联系人',
      dataIndex: 'ContactPerson',
      key: 'ContactPerson',
    },
    {
      title: '电话',
      dataIndex: 'Phone',
      key: 'Phone',
    },
    {
      title: '邮箱',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: '地址',
      dataIndex: 'Address',
      key: 'Address',
      ellipsis: true,
    },
    {
      title: '税号',
      dataIndex: 'TaxNumber',
      key: 'TaxNumber',
    },
    {
      title: '银行账户',
      dataIndex: 'BankAccount',
      key: 'BankAccount',
    },
    {
      title: '开户行',
      dataIndex: 'BankName',
      key: 'BankName',
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.Id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={suppliers}
      rowKey="Id"
      loading={loading}
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
      className="supplier-table"
      scroll={{ x: 1200 }}
    />
  );
};

export default SuppliersTable;
