import React, { useState, useEffect } from 'react';
import { Card, message, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../../utils/api';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import BankAccountsTable from './components/BankAccountsTable';
import BankAccountModal from './components/BankAccountModal';
import BalanceModal from './components/BalanceModal';
import { useBankAccounts } from './hooks/useBankAccounts';
import { useBanks } from './hooks/useBanks';
import { useCurrencies } from './hooks/useCurrencies';
import { bankAccountTableStyles, balanceTableStyles } from './styles';

const BankAccounts = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingBalance, setEditingBalance] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  const {
    accounts,
    filteredAccounts,
    loading,
    fetchAccounts,
    handleSearch,
    handleReset,
    handleDelete,
    handleDeleteBalance
  } = useBankAccounts();

  const { banks, fetchBanks } = useBanks();
  const { currencies, fetchCurrencies } = useCurrencies();

  useEffect(() => {
    fetchAccounts();
    fetchBanks();
    fetchCurrencies();
    
    // 开发模式下显示 ResizeObserver 修复状态
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 BankAccounts 页面已加载，ResizeObserver 修复状态:', {
        globalFix: typeof window !== 'undefined' && window.ResizeObserver && window.ResizeObserver._patched,
        resizeObserverState: typeof window !== 'undefined' ? window.__resizeObserverState : null
      });
    }
  }, []);

  const handleCreate = () => {
    setEditingAccount(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAccount(record);
    setModalVisible(true);
  };

  const handleAddBalance = (account) => {
    setEditingBalance(null);
    setCurrentAccount(account);
    setBalanceModalVisible(true);
  };

  const handleEditBalance = (balance) => {
    setEditingBalance(balance);
    const account = accounts.find(acc => acc.Id === balance.BankAccountId);
    if (account) {
      setCurrentAccount(account);
    }
    setBalanceModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingAccount(null);
  };

  const handleBalanceModalClose = () => {
    setBalanceModalVisible(false);
    setEditingBalance(null);
    setCurrentAccount(null);
  };

  const handleSuccess = () => {
    fetchAccounts();
    handleModalClose();
  };

  const handleBalanceSuccess = () => {
    fetchAccounts();
    handleBalanceModalClose();
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{bankAccountTableStyles}</style>
        <style>{balanceTableStyles}</style>

        <Card
          title="银行账户管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增银行账户
            </Button>
          }
        >
          <SearchForm
            banks={banks}
            currencies={currencies}
            onSearch={handleSearch}
            onReset={handleReset}
          />

          <BankAccountsTable
            accounts={filteredAccounts}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddBalance={handleAddBalance}
            onEditBalance={handleEditBalance}
            onDeleteBalance={handleDeleteBalance}
            currencies={currencies}
          />
        </Card>

        <BankAccountModal
          visible={modalVisible}
          editingAccount={editingAccount}
          banks={banks}
          currencies={currencies}
          onCancel={handleModalClose}
          onSuccess={handleSuccess}
        />

        <BalanceModal
          visible={balanceModalVisible}
          editingBalance={editingBalance}
          currentAccount={currentAccount}
          currencies={currencies}
          onCancel={handleBalanceModalClose}
          onSuccess={handleBalanceSuccess}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default BankAccounts;
