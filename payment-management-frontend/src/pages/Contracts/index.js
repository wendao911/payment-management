import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Tag, Space, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from '../../utils/dayjs';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import { apiClient } from '../../utils/api';
import SearchForm from './SearchForm';
import ContractFormModal from './ContractFormModal';
import ContractDetailModal from './ContractDetailModal';
import { Table } from 'antd';

const { confirm } = Modal;

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contractTreeData, setContractTreeData] = useState([]);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [currentAttachments, setCurrentAttachments] = useState([]);

  useEffect(() => {
    fetchContracts();
    fetchSuppliers();
  }, []);

  const preprocessContractData = (data) => {
    return (data || []).map((contract) => {
      const processed = { ...contract };
      if (processed.children && Array.isArray(processed.children)) {
        processed.children = processed.children.length > 0 ? preprocessContractData(processed.children) : undefined;
      }
      return processed;
    });
  };

  const convertToTreeSelectFormat = (contracts) => {
    return contracts.map(contract => ({
      title: `${contract.ContractNumber} - ${contract.Title || '无标题'}`,
      value: contract.Id,
      key: contract.Id,
      children: contract.children ? convertToTreeSelectFormat(contract.children) : []
    }));
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const data = preprocessContractData(response.data || []);
        setContracts(data);
        setFilteredContracts(data);
        
        // 转换为树形选择器格式
        const treeData = convertToTreeSelectFormat(data);
        setContractTreeData(treeData);
      } else {
        message.error(response.message || '获取合同列表失败');
        setContracts([]);
        setFilteredContracts([]);
        setContractTreeData([]);
      }
    } catch (e) {
      console.error('Error fetching contracts:', e);
      message.error('获取合同列表失败');
      setContracts([]);
      setFilteredContracts([]);
      setContractTreeData([]);
    }
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        setSuppliers([]);
      }
    } catch (e) {
      console.error('Error fetching suppliers:', e);
      setSuppliers([]);
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.contractNumber) params.append('contractNumber', values.contractNumber);
      if (values.title) params.append('title', values.title);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.status) params.append('status', values.status);
      if (values.dateRange && values.dateRange.length === 2) {
        params.append('startDate', values.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.dateRange[1].format('YYYY-MM-DD'));
      }
      const response = await apiClient.get(`/contract/search?${params.toString()}`);
      if (response.success) {
        setFilteredContracts(preprocessContractData(response.data || []));
      } else {
        message.error(response.message || '查询失败');
        setFilteredContracts([]);
      }
    } catch (e) {
      console.error('Error searching contracts:', e);
      message.error('查询失败，请检查网络连接');
      setFilteredContracts([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    await fetchContracts();
  };

  const handleCreate = () => {
    setEditingContract(null);
    setFormModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingContract(record);
    setFormModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个合同吗？',
      onOk: async () => {
        try {
          const resp = await apiClient.delete(`/contract/${id}`);
          if (resp.success) {
            message.success('删除成功');
            fetchContracts();
          } else {
            message.error(resp.message || '删除失败');
          }
        } catch (e) {
          console.error('Error deleting contract:', e);
          message.error('删除失败');
        }
      },
    });
  };

  const openDetail = async (record) => {
    try {
      const id = record.Id || record.id;
      const [detailResp, attachResp] = await Promise.all([
        apiClient.get(`/contract/${id}`),
        apiClient.get(`/attachment/contract/${id}`)
      ]);
      if (detailResp.success) {
        setCurrentContract(detailResp.data);
      } else {
        setCurrentContract(record);
      }
      if (attachResp.success) {
        setCurrentAttachments(attachResp.data || []);
      } else {
        setCurrentAttachments([]);
      }
      setDetailModalVisible(true);
    } catch (e) {
      console.error('Error opening contract detail:', e);
      setCurrentContract(record);
      setCurrentAttachments([]);
      setDetailModalVisible(true);
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        ContractNumber: values.contractNumber,
        Title: values.title,
        Description: values.description,
        ContractDate: values.contractDate ? dayjs(values.contractDate).format('YYYY-MM-DD') : null,
        StartDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : null,
        EndDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        Status: values.status,
        SupplierId: values.supplierId,
        ParentContractId: values.parentContractId,
      };

      if (editingContract) {
        const id = editingContract.Id || editingContract.id;
        const resp = await apiClient.put(`/contract/${id}`, payload);
        if (resp.success) {
          message.success('更新成功');
        } else {
          message.error(resp.message || '更新失败');
          return;
        }
      } else {
        const resp = await apiClient.post('/contract', payload);
        if (resp.success) {
          message.success('创建成功');
        } else {
          message.error(resp.message || '创建失败');
          return;
        }
      }

      setFormModalVisible(false);
      setEditingContract(null);
      fetchContracts();
    } catch (e) {
      console.error('Error saving contract:', e);
      if (e.response?.data?.message) {
        message.error(`保存失败: ${e.response.data.message}`);
      } else {
        message.error('保存失败');
      }
    }
  };

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
      render: (v) => (v ? dayjs(v).utc().format('YYYY-MM-DD') : '未设置'),
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
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)}>详情</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.Id)}>删除</Button>
        </Space>
      ),
    },
  ]), [suppliers]);

  // 样式（沿用原逻辑）
  const contractTableStyles = `
    .contract-table .ant-table-thead > tr > th { background-color: #f0f8ff !important; color: #1890ff !important; font-weight: bold !important; border-color: #d9d9d9 !important; }
    .contract-table .ant-table-tbody > tr > td { border-color: #f0f0f0 !important; }
    .contract-table .ant-table-tbody > tr:hover > td { background-color: #f6ffed !important; }
    .contract-table .ant-table-pagination { margin: 16px 0 !important; }
    .contract-table .ant-table-pagination .ant-pagination-item { border-radius: 4px !important; }
    .contract-table .ant-table-pagination .ant-pagination-item-active { border-color: #1890ff !important; background-color: #1890ff !important; }
    .contract-table .ant-table-pagination .ant-pagination-item-active a { color: white !important; }
    .search-form .ant-form-item-label { text-align: left !important; line-height: 32px !important; margin-bottom: 4px !important; }
    .search-form .ant-form-item-label > label { height: 32px !important; line-height: 32px !important; font-weight: 500 !important; color: #333 !important; }
    .search-form .ant-form-item-control { line-height: 32px !important; }
    .search-form .ant-form-item { margin-bottom: 16px !important; }
    .search-form .ant-select, .search-form .ant-input, .search-form .ant-picker { width: 100% !important; }
  `;

  return (
    <ResizeObserverFix>
      <div>
        <style>{contractTableStyles}</style>
        <Card
          title="合同管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增合同</Button>
          }
        >
          <Card size="small" style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}>
            <SearchForm onSearch={handleSearch} onReset={handleReset} suppliers={suppliers} />
          </Card>

          <Table
            columns={columns}
            dataSource={filteredContracts}
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
        </Card>

        <ContractFormModal
          visible={formModalVisible}
          onCancel={() => setFormModalVisible(false)}
          onSubmit={handleFormSubmit}
          editingContract={editingContract}
          suppliers={suppliers}
          contracts={contracts}
          contractTreeData={contractTreeData}
        />

        <ContractDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          contract={currentContract}
          attachments={currentAttachments}
          onEdit={() => {
            setEditingContract(currentContract);
            setDetailModalVisible(false);
            setFormModalVisible(true);
          }}
          onDelete={() => {
            if (!currentContract) return;
            handleDelete(currentContract.Id || currentContract.id);
          }}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default ContractsPage;


