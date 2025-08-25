import React, { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import CurrenciesTable from './components/CurrenciesTable';
import CurrencyModal from './components/CurrencyModal';
import { useCurrencies } from './hooks/useCurrencies';
import { currencyTableStyles } from './styles';

const Currencies = () => {
  const [ModalVisible, setModalVisible] = useState(false);
  const [EditingCurrency, setEditingCurrency] = useState(null);

  const {
    Currencies,
    FilteredCurrencies,
    Loading,
    FetchCurrencies,
    HandleSearch,
    HandleReset,
    HandleDelete
  } = useCurrencies();

  useEffect(() => {
    FetchCurrencies();
  }, []);

  const HandleCreate = () => {
    setEditingCurrency(null);
    setModalVisible(true);
  };

  const HandleEdit = (Record) => {
    setEditingCurrency(Record);
    setModalVisible(true);
  };

  const HandleModalClose = () => {
    setModalVisible(false);
    setEditingCurrency(null);
  };

  const HandleSuccess = () => {
    FetchCurrencies();
    HandleModalClose();
    message.success('操作成功');
  };

  const HandleRefresh = () => {
    FetchCurrencies();
    message.success('数据已刷新');
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{currencyTableStyles}</style>

        <Card
          title="币种管理"
          extra={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={HandleRefresh}
                loading={Loading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={HandleCreate}
              >
                新增币种
              </Button>
            </div>
          }
        >
          <SearchForm
            OnSearch={HandleSearch}
            OnReset={HandleReset}
          />

          <CurrenciesTable
            Currencies={FilteredCurrencies}
            Loading={Loading}
            OnEdit={HandleEdit}
            OnDelete={HandleDelete}
          />
        </Card>

        <CurrencyModal
          Visible={ModalVisible}
          EditingCurrency={EditingCurrency}
          OnCancel={HandleModalClose}
          OnSuccess={HandleSuccess}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Currencies;
