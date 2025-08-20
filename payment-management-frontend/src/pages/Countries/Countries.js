import React, { useState, useEffect } from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import CountriesTable from './components/CountriesTable';
import CountryModal from './components/CountryModal';
import { useCountries } from './hooks/useCountries';
import { countryTableStyles } from './styles';

const Countries = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);

  const {
    countries,
    filteredCountries,
    loading,
    fetchCountries,
    handleSearch,
    handleReset,
    handleDelete
  } = useCountries();

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleCreate = () => {
    setEditingCountry(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCountry(record);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingCountry(null);
  };

  const handleSuccess = () => {
    fetchCountries();
    handleModalClose();
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{countryTableStyles}</style>

        <Card
          title="国家管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增国家
            </Button>
          }
        >
          <SearchForm
            onSearch={handleSearch}
            onReset={handleReset}
          />

          <CountriesTable
            countries={filteredCountries}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        <CountryModal
          visible={modalVisible}
          editingCountry={editingCountry}
          onCancel={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Countries;
