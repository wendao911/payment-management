import React, { useState, useEffect } from 'react';
import { Card, message, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../../utils/api';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import BanksTable from './components/BanksTable';
import BankModal from './components/BankModal';
import { useBanks } from './hooks/useBanks';
import { useCountries } from './hooks/useCountries';
import { bankTableStyles } from './styles';

const Banks = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  const {
    banks,
    filteredBanks,
    loading,
    fetchBanks,
    handleSearch,
    handleReset,
    handleDelete
  } = useBanks();

  const { countries, fetchCountries } = useCountries();

  useEffect(() => {
    fetchBanks();
    fetchCountries();
  }, []);

  const handleCreate = () => {
    setEditingBank(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBank(record);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingBank(null);
  };

  const handleSuccess = () => {
    fetchBanks();
    handleModalClose();
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{bankTableStyles}</style>

        <Card
          title="银行管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增银行
            </Button>
          }
        >
          <SearchForm
            countries={countries}
            onSearch={handleSearch}
            onReset={handleReset}
          />

          <BanksTable
            banks={filteredBanks}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        <BankModal
          visible={modalVisible}
          editingBank={editingBank}
          countries={countries}
          onCancel={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Banks;
