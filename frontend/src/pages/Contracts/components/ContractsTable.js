import React, { useMemo } from 'react';
import { Button, Tag, Space, Table } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';

const ContractsTable = ({ loading, dataSource, suppliers, onView, onEdit, onDelete }) => {
  const columns = useMemo(() => ([
    {
      title: '合同编号',
      dataIndex: 'ContractNumber',
      key: 'ContractNumber',
    },
    {
      title: '合同标题',
      dataIndex: 'Title',
      key: 'Title',
    },
    {
      title: '合同描述',
      dataIndex: 'Description',
      key: 'Description',
      render: (v) => v || '无描述',
    },
    {
      title: '供应商',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
    },
    {
      title: '合同日期',
      dataIndex: 'ContractDate',
      key: 'ContractDate',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '未设置'),
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      render: (value) => (
        <Tag color={value === 'active' ? 'green' : 'default'}>{value || 'active'}</Tag>
      ),
    },
    {
      title: '附件',
      key: 'attachments',
      render: (_, record) => {
        const count = record.AttachmentCount ?? (record.attachments ? record.attachments.length : 0) ?? 0;
        return count > 0 ? <Tag color="blue">{count} 个</Tag> : <Tag>无</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record)}>详情</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.Id)}>删除</Button>
        </Space>
      ),
    },
  ]), [onView, onEdit, onDelete]);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="Id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        position: ['bottomCenter'],
        size: 'default',
      }}
      locale={{ emptyText: '暂无数据' }}
      size="middle"
      bordered={false}
      className="contract-table"
      scroll={{ x: 1500 }}
    />
  );
};

export default ContractsTable;
