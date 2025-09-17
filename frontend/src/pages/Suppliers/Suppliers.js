import React, { useState, useEffect } from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import SuppliersTable from './components/SuppliersTable';
import SupplierModal from './components/SupplierModal';
import { useSuppliers } from './hooks/useSuppliers';
import { supplierTableStyles } from './styles';

const Suppliers = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const {
    suppliers,
    filteredSuppliers,
    loading,
    fetchSuppliers,
    handleSearch,
    handleReset,
    handleDelete
  } = useSuppliers();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = () => {
    setEditingSupplier(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSupplier(record);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingSupplier(null);
  };

  const handleSuccess = () => {
    fetchSuppliers();
    handleModalClose();
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{supplierTableStyles}</style>

        <Card
          title="供应商管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增供应商
            </Button>
          }
        >
          <SearchForm
            onSearch={handleSearch}
            onReset={handleReset}
          />

          <SuppliersTable
            suppliers={filteredSuppliers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        <SupplierModal
          visible={modalVisible}
          editingSupplier={editingSupplier}
          onCancel={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Suppliers;
