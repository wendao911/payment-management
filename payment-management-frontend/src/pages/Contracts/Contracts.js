import React, { useState } from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import { apiClient } from '../../utils/api';
import { contractTableStyles } from './styles';
import SearchForm from './components/SearchForm';
import ContractsTable from './components/ContractsTable';
import ContractFormModal from './components/ContractFormModal';
import ContractDetailModal from './components/ContractDetailModal';
import { useContracts } from './hooks/useContracts';

const Contracts = () => {
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [currentAttachments, setCurrentAttachments] = useState([]);

  const {
    contracts,
    filteredContracts,
    loading,
    suppliers,
    contractTreeData,
    fetchContracts,
    handleSearch,
    handleReset,
    handleDelete,
    handleFormSubmit,
  } = useContracts();

  const handleCreate = () => {
    setEditingContract(null);
    setFormModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingContract(record);
    setFormModalVisible(true);
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

  const onFormSubmit = async (values) => {
    const success = await handleFormSubmit(values);
    if (success) {
      setFormModalVisible(false);
      setEditingContract(null);
    }
  };

  const onFormCancel = () => {
    setFormModalVisible(false);
    setEditingContract(null);
  };

  const onDetailCancel = () => {
    setDetailModalVisible(false);
    setCurrentContract(null);
    setCurrentAttachments([]);
  };

  const onDetailEdit = () => {
    setEditingContract(currentContract);
    setDetailModalVisible(false);
    setFormModalVisible(true);
  };

  const onDetailDelete = () => {
    if (!currentContract) return;
    handleDelete(currentContract.Id || currentContract.id);
  };

  return (
    <ResizeObserverFix>
      <div>
        <style>{contractTableStyles}</style>
        
        <Card
          title="合同管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增合同
            </Button>
          }
        >
          <Card size="small" style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}>
            <SearchForm 
              onSearch={handleSearch} 
              onReset={handleReset} 
              suppliers={suppliers} 
            />
          </Card>

          <ContractsTable
            loading={loading}
            dataSource={filteredContracts}
            suppliers={suppliers}
            onView={openDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        <ContractFormModal
          visible={formModalVisible}
          onCancel={onFormCancel}
          onSubmit={onFormSubmit}
          editingContract={editingContract}
          suppliers={suppliers}
          contracts={contracts}
          contractTreeData={contractTreeData}
        />

        <ContractDetailModal
          visible={detailModalVisible}
          onCancel={onDetailCancel}
          contract={currentContract}
          attachments={currentAttachments}
          onEdit={onDetailEdit}
          onDelete={onDetailDelete}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Contracts;
