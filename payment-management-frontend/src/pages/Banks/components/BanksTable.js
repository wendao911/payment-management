import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getBankTypeText, getBankTypeColor } from '../utils/helpers';

const BanksTable = ({
  banks,
  loading,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: '银行代码',
      dataIndex: 'BankCode',
      key: 'BankCode',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '银行名称',
      dataIndex: 'BankName',
      key: 'BankName',
    },
    {
      title: '所属国家',
      dataIndex: 'CountryName',
      key: 'CountryName',
      render: (text, record) => (
        <Space>
          <Tag color="green">{text}</Tag>
          <Tag color="orange">{record.CountryCode}</Tag>
        </Space>
      ),
    },
    {
      title: '银行类型',
      dataIndex: 'BankType',
      key: 'BankType',
      render: (type) => (
        <Tag color={getBankTypeColor(type)}>
          {getBankTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '官网',
      dataIndex: 'Website',
      key: 'Website',
      render: (text) => text ? (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) : '-',
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
      dataSource={banks}
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
      className="bank-table"
      scroll={{ x: 1200 }}
    />
  );
};

export default BanksTable;
