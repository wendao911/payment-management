import React, { useEffect, useState } from 'react';
import { Card, Form, message } from 'antd';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import { paymentRecordTableStyles } from './styles';
import SearchForm from './components/SearchForm';
import PaymentRecordsTable from './components/PaymentRecordsTable';
import PaymentRecordDetailModal from './components/PaymentRecordDetailModal';
import SummaryCards from './components/SummaryCards';
import { usePaymentRecords } from './hooks/usePaymentRecords';
import { apiClient } from '../../utils/api';

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

  const onExport = async () => {
    try {
      // 获取当前搜索条件
      const searchValues = searchForm.getFieldsValue();
      
      // 处理日期范围
      let startDate, endDate;
      if (searchValues.paymentDateRange && searchValues.paymentDateRange.length === 2) {
        startDate = searchValues.paymentDateRange[0].format('YYYY-MM-DD');
        endDate = searchValues.paymentDateRange[1].format('YYYY-MM-DD');
      }
      
      // 构建导出参数
      const exportParams = {
        paymentNumber: searchValues.paymentNumber,
        payableManagementId: searchValues.payableManagementId,
        supplierId: searchValues.supplierId,
        contractId: searchValues.contractId,
        startDate,
        endDate
      };
      
      // 移除空值
      Object.keys(exportParams).forEach(key => {
        if (!exportParams[key]) {
          delete exportParams[key];
        }
      });
      
      message.loading('正在导出Excel文件...', 0);
      
      const result = await apiClient.exportExcel(
        '/payment-records/export/excel',
        exportParams,
        `付款记录_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      message.destroy();
      
      if (result.success) {
        message.success('导出成功！');
      } else {
        message.error(result.message || '导出失败');
      }
    } catch (error) {
      message.destroy();
      message.error('导出失败：' + (error.message || '未知错误'));
      console.error('导出Excel错误:', error);
    }
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
              onExport={onExport}
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
