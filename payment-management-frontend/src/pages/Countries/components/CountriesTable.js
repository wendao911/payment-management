import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const CountriesTable = ({
  countries,
  loading,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: '国家代码',
      dataIndex: 'Code',
      key: 'Code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '国家名称',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: '默认货币',
      dataIndex: 'CurrencyCode',
      key: 'CurrencyCode',
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
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
      dataSource={countries}
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
      className="country-table"
      scroll={{ x: 1200 }}
    />
  );
};

export default CountriesTable;
