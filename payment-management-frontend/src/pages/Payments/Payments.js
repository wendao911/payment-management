import React, { useState, useEffect } from 'react';
import { Card, Button, message, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../../utils/api';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SearchForm from './components/SearchForm';
import PaymentsTable from './components/PaymentsTable';
import PayableModal from './components/PayableModal';
import PaymentRecordModal from './components/PaymentRecordModal';
import PayableDetailModal from './components/PayableDetailModal';
import PaymentRecordDetailModal from './components/PaymentRecordDetailModal';
import PaymentWarningSummary from '../../components/PaymentWarningSummary';
import { paymentTableStyles } from './styles';
import { usePayables } from './hooks/usePayables';
import { usePaymentRecords } from './hooks/usePaymentRecords';
import { useWarnings } from './hooks/useWarnings';
import { useCurrencies } from './hooks/useCurrencies';
import { useSuppliers } from './hooks/useSuppliers';
import { useContracts } from './hooks/useContracts';

const Payments = () => {
  // 模态框状态
  const [payableModalVisible, setPayableModalVisible] = useState(false);
  const [editingPayable, setEditingPayable] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPayable, setCurrentPayable] = useState(null);
  const [paymentRecordModalVisible, setPaymentRecordModalVisible] = useState(false);
  const [viewPaymentRecordModalVisible, setViewPaymentRecordModalVisible] = useState(false);
  const [viewingPaymentRecord, setViewingPaymentRecord] = useState(null);
  const [editPaymentRecordModalVisible, setEditPaymentRecordModalVisible] = useState(false);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState(null);

  // 表单实例
  const [searchForm] = Form.useForm();

  // 使用自定义hooks
  const {
    payables,
    filteredPayables,
    loading,
    editLoading,
    setEditLoading,
    fetchPayables,
    handleSearch,
    handleReset,
    handleDelete,
    handlePayableSubmit,
    handleWarningViewDetails
  } = usePayables();

  const {
    selectedPayableId,
    setSelectedPayableId,
    handleAddPaymentRecord,
    handlePaymentRecordSubmit,
    handleViewPaymentRecord,
    handleEditPaymentRecord,
    handlePaymentRecordEdit,
    handleDeletePaymentRecord
  } = usePaymentRecords();

  const { warnings, fetchWarnings } = useWarnings();
  const { currencies, fetchCurrencies } = useCurrencies();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { contracts, contractTreeData, fetchContracts } = useContracts();

  // 初始化数据
  useEffect(() => {
    fetchPayables();
    fetchWarnings();
    fetchCurrencies();
    fetchSuppliers();
    fetchContracts();
    
    // 检查URL参数，应用相应的过滤
    const urlParams = new URLSearchParams(window.location.search);
    const filterType = urlParams.get('filter');
    if (filterType) {
      // 延迟执行，确保数据已加载
      setTimeout(() => {
        handleWarningViewDetails(filterType);
      }, 1000);
    }
  }, []);

  // 事件处理函数
  const handleCreate = () => {
    setEditingPayable(null);
    setPayableModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      setEditLoading(true);
      // 编辑时先调用后端接口获取最新数据
      const recordId = record.Id || record.id;
      const response = await apiClient.get(`/payment/${recordId}`);
      if (response.success && response.data) {
        setEditingPayable(response.data);
        setPayableModalVisible(true);
      } else {
        message.error(response.message || '获取应付详情失败');
      }
    } catch (error) {
      console.error('Error fetching payable detail for editing:', error);
      message.error('获取应付详情失败，使用现有数据');
      // 如果获取失败，使用现有数据作为备选方案
      setEditingPayable(record);
      setPayableModalVisible(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const recordId = record.Id || record.id;
      const response = await apiClient.get(`/payment/${recordId}`);
      if (response.success && response.data) {
        setCurrentPayable(response.data);
        setDetailModalVisible(true);
      } else {
        message.error(response.message || '获取详情失败');
      }
    } catch (error) {
      console.error('Error fetching payable detail:', error);
      message.error('获取详情失败');
    }
  };

  const handlePayableModalClose = () => {
    setPayableModalVisible(false);
    setEditingPayable(null);
  };

  const handlePayableSuccess = async (values) => {
    const success = await handlePayableSubmit(values, editingPayable);
    if (success) {
      handlePayableModalClose();
      fetchWarnings();
    }
  };

  const handlePaymentRecordModalClose = () => {
    setPaymentRecordModalVisible(false);
    setSelectedPayableId(null);
  };

  const handlePaymentRecordSuccess = async (values) => {
    const success = await handlePaymentRecordSubmit(values);
    if (success) {
      handlePaymentRecordModalClose();
      fetchPayables();
      fetchWarnings();
    }
  };

  const handleViewPaymentRecordModal = async (paymentRecord) => {
    const recordData = await handleViewPaymentRecord(paymentRecord);
    setViewingPaymentRecord(recordData);
    setViewPaymentRecordModalVisible(true);
  };

  const handleEditPaymentRecordModal = async (paymentRecord) => {
    const recordData = await handleEditPaymentRecord(paymentRecord);
    setEditingPaymentRecord(recordData);
    setEditPaymentRecordModalVisible(true);
  };

  const handlePaymentRecordEditSuccess = async (values) => {
    const success = await handlePaymentRecordEdit(values, editingPaymentRecord, () => {
      fetchPayables();
      fetchWarnings();
    });
    if (success) {
      setEditPaymentRecordModalVisible(false);
      setEditingPaymentRecord(null);
    }
  };

  const handleDeletePaymentRecordSuccess = (paymentRecord) => {
    handleDeletePaymentRecord(paymentRecord, () => {
      fetchPayables();
      fetchWarnings();
    });
  };

  const handleAddPaymentRecordSuccess = (payableId) => {
    if (handleAddPaymentRecord(payableId)) {
      setPaymentRecordModalVisible(true);
    }
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{paymentTableStyles}</style>

        {/* 付款预警统计 */}
        <PaymentWarningSummary onViewDetails={handleWarningViewDetails} />

        <Card
          title="应付管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增应付
            </Button>
          }
        >
          {/* 查询表单 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <SearchForm
              form={searchForm}
              onSearch={handleSearch}
              onReset={handleReset}
              suppliers={suppliers}
              contractTreeData={contractTreeData}
              loading={loading}
            />
          </Card>

          {/* 主表格 */}
          <PaymentsTable
            payables={filteredPayables}
            loading={loading}
            currencies={currencies}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddPaymentRecord={handleAddPaymentRecordSuccess}
            onViewPaymentRecord={handleViewPaymentRecordModal}
            onEditPaymentRecord={handleEditPaymentRecordModal}
            onDeletePaymentRecord={handleDeletePaymentRecordSuccess}
          />
        </Card>

        {/* 模态框组件 */}
        <PayableModal
          visible={payableModalVisible}
          onCancel={handlePayableModalClose}
          onSubmit={handlePayableSuccess}
          editingPayable={editingPayable}
          currencies={currencies}
          suppliers={suppliers}
          contractTreeData={contractTreeData}
          contracts={contracts}
          loading={editLoading}
        />

        <PaymentRecordModal
          visible={paymentRecordModalVisible}
          onCancel={handlePaymentRecordModalClose}
          onSubmit={handlePaymentRecordSuccess}
          currencies={currencies}
          payableId={selectedPayableId}
        />

        <PayableDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          currentPayable={currentPayable}
          onEdit={() => {
            setEditingPayable(currentPayable);
            setPayableModalVisible(true);
            setDetailModalVisible(false);
          }}
          onDelete={() => handleDelete(currentPayable.Id || currentPayable.id)}
          onAddPaymentRecord={handleAddPaymentRecordSuccess}
          onViewPaymentRecord={handleViewPaymentRecordModal}
          onEditPaymentRecord={handleEditPaymentRecordModal}
          onDeletePaymentRecord={handleDeletePaymentRecordSuccess}
          onRefresh={fetchPayables}
          currencies={currencies}
        />

        <PaymentRecordDetailModal
          visible={viewPaymentRecordModalVisible}
          onCancel={() => setViewPaymentRecordModalVisible(false)}
          viewingPaymentRecord={viewingPaymentRecord}
          onEdit={handleEditPaymentRecordModal}
          onRefresh={fetchPayables}
          currencies={currencies}
        />

        <PaymentRecordModal
          visible={editPaymentRecordModalVisible}
          onCancel={() => setEditPaymentRecordModalVisible(false)}
          onSubmit={handlePaymentRecordEditSuccess}
          editingRecord={editingPaymentRecord}
          currencies={currencies}
          isEdit={true}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Payments;
