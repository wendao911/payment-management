import React from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const CurrenciesTable = ({ Currencies, Loading, OnEdit, OnDelete }) => {
  const columns = [
    {
      title: '币种代码',
      dataIndex: 'Code',
      key: 'Code',
      width: 100,
      render: (Code) => (
        <span className="currency-code">{Code}</span>
      ),
    },
    {
      title: '币种名称',
      dataIndex: 'Name',
      key: 'Name',
      width: 150,
    },
    {
      title: '币种符号',
      dataIndex: 'Symbol',
      key: 'Symbol',
      width: 100,
      render: (Symbol) => (
        Symbol ? <span className="currency-symbol">{Symbol}</span> : '-'
      ),
    },
    {
      title: '对美元汇率',
      dataIndex: 'ExchangeRate',
      key: 'ExchangeRate',
      width: 120,
      render: (ExchangeRate) => (
        <span className="exchange-rate">
          {Number(ExchangeRate).toFixed(6)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'IsActive',
      width: 80,
      render: (IsActive) => (
        <Tag color={IsActive ? 'green' : 'red'}>
          {IsActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      width: 150,
      render: (CreatedAt) => (
        CreatedAt ? dayjs(CreatedAt).format('YYYY-MM-DD HH:mm') : '-'
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'UpdatedAt',
      key: 'UpdatedAt',
      width: 150,
      render: (UpdatedAt) => (
        UpdatedAt ? dayjs(UpdatedAt).format('YYYY-MM-DD HH:mm') : '-'
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, Record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => OnEdit(Record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => OnEdit(Record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => OnDelete(Record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      className="currency-table"
      columns={columns}
      dataSource={Currencies}
      loading={Loading}
      rowKey="Id"
      scroll={{ x: 1200 }}
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
    />
  );
};

export default CurrenciesTable;
