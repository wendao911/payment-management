import React, { useEffect, useState } from 'react';
import { Card, Form } from 'antd';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import { paymentRecordTableStyles } from './styles';
import SearchForm from './components/SearchForm';
import PaymentRecordsTable from './components/PaymentRecordsTable';
import PaymentRecordDetailModal from './components/PaymentRecordDetailModal';
import SummaryCards from './components/SummaryCards';
import { usePaymentRecords } from './hooks/usePaymentRecords';

const PaymentRecords = () => {
  const [searchForm] = Form.useForm();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const {
    paymentRecords,
    filteredRecords,
    loading,
    payables,
    currencies,
    suppliers,
    contractTreeData,
    fetchInitialData,
    fetchPaymentRecords,
    handleSearch,
    fetchRecordDetail,
  } = usePaymentRecords();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const onSearch = async (values) => {
    await handleSearch(values);
  };

  const onReset = async () => {
    searchForm.resetFields();
    await fetchPaymentRecords();
  };

  const onView = async (record) => {
    const detail = await fetchRecordDetail(record);
    setViewingRecord(detail);
    setViewModalVisible(true);
  };

  return (
    <ResizeObserverFix>
      <div>
        <style>{paymentRecordTableStyles}</style>

        <SummaryCards paymentRecords={paymentRecords} currencies={currencies} />

        <Card title="付款记录查询">
          <Card size="small" style={{ marginBottom: 16 }}>
            <SearchForm
              form={searchForm}
              onSearch={onSearch}
              onReset={onReset}
              payables={payables}
              suppliers={suppliers}
              contractTreeData={contractTreeData}
              loading={loading}
            />
          </Card>

          <PaymentRecordsTable
            loading={loading}
            dataSource={filteredRecords}
            currencies={currencies}
            payables={payables}
            onView={onView}
          />
        </Card>

        <PaymentRecordDetailModal
          visible={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          viewingPaymentRecord={viewingRecord}
          onRefresh={fetchPaymentRecords}
          currencies={currencies}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default PaymentRecords;
