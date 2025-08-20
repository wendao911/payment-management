import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Alert,
  message,
  Modal,
  Form
} from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from '../../utils/dayjs';
import { apiClient } from '../../utils/api';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SafeTable from '../../components/SafeTable';
import SearchForm from './SearchForm';
import PayableModal from './PayableModal';
import PaymentRecordModal from './PaymentRecordModal';
import PayableDetailModal from './PayableDetailModal';
import PaymentRecordDetailModal from './PaymentRecordDetailModal';
import PaymentWarningSummary from '../../components/PaymentWarningSummary';
import { paymentTableStyles, getPayableColumns, getPaymentRecordColumns } from './styles';
import { convertToUSD, findContractById, validatePayableData, validatePaymentRecordData } from './utils';

const { confirm } = Modal;

const Payments = () => {
  // 状态管理
  const [payables, setPayables] = useState([]);
  const [filteredPayables, setFilteredPayables] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [contractTreeData, setContractTreeData] = useState([]);

  // 模态框状态
  const [payableModalVisible, setPayableModalVisible] = useState(false);
  const [editingPayable, setEditingPayable] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPayable, setCurrentPayable] = useState(null);
  const [paymentRecordModalVisible, setPaymentRecordModalVisible] = useState(false);
  const [selectedPayableId, setSelectedPayableId] = useState(null);
  const [viewPaymentRecordModalVisible, setViewPaymentRecordModalVisible] = useState(false);
  const [viewingPaymentRecord, setViewingPaymentRecord] = useState(null);
  const [editPaymentRecordModalVisible, setEditPaymentRecordModalVisible] = useState(false);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState(null);

  // 编辑加载状态
  const [editLoading, setEditLoading] = useState(false);

  // 表单实例
  const [searchForm] = Form.useForm();

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

  // 数据处理辅助函数
  const processPayablesData = async (payablesData) => {
    const processedData = [...payablesData];

    for (let payable of processedData) {
      // 确保数值字段有默认值
      payable.PayableAmount = payable.PayableAmount || 0;
      payable.TotalPaidAmount = payable.TotalPaidAmount || 0;
      payable.RemainingAmount = payable.RemainingAmount || 0;

      // 确保其他字段有默认值
      payable.CurrencySymbol = payable.CurrencySymbol || '';
      payable.ContractNumber = payable.ContractNumber || '';
      payable.SupplierName = payable.SupplierName || '';
      payable.Status = payable.Status || 'pending';
      payable.Importance = payable.Importance || 'normal';
      payable.Urgency = payable.Urgency || 'normal';

      const payableId = payable.Id || payable.id;
      if (!payableId) {
        console.warn('应付管理记录缺少ID字段:', payable);
        payable.paymentRecords = [];
        continue;
      }

      try {
        const paymentRecordsResponse = await apiClient.get(`/payment-records/payable/${payableId}`);
        if (paymentRecordsResponse.success) {
          payable.paymentRecords = paymentRecordsResponse.data || [];
        } else {
          payable.paymentRecords = [];
        }
      } catch (error) {
        console.warn(`获取应付管理 ${payableId} 的付款记录失败:`, error.message);
        payable.paymentRecords = [];
      }
    }

    return processedData;
  };

  // 数据获取函数
  const fetchPayables = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment');
      if (response.success) {
        const payablesData = response.data || [];
        const processedData = await processPayablesData(payablesData);

        setPayables(processedData);
        setFilteredPayables(processedData);
      } else {
        setPayables([]);
        setFilteredPayables([]);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
      setPayables([]);
      setFilteredPayables([]);
    }
    setLoading(false);
  };

  const fetchWarnings = async () => {
    try {
      const response = await apiClient.get('/payment/overdue/list');
      if (response.success) {
        setWarnings(response.data || []);
      } else {
        setWarnings([]);
      }
    } catch (error) {
      console.error('Error fetching warnings:', error);
      setWarnings([]);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await apiClient.get('/currencies');
      if (response.success) {
        setCurrencies(response.data || []);
      } else {
        setCurrencies([]);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setCurrencies([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const contractsData = response.data || [];
        setContracts(contractsData);

        // 转换为树形选择器格式
        const convertToTreeSelectFormat = (contracts) => {
          return contracts.map(contract => ({
            title: `${contract.ContractNumber} - ${contract.Title || '无标题'}`,
            value: contract.Id,
            key: contract.Id,
            children: contract.children ? convertToTreeSelectFormat(contract.children) : []
          }));
        };

        const treeData = convertToTreeSelectFormat(contractsData);
        setContractTreeData(treeData);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

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

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个应付管理记录吗？',
      onOk: async () => {
        try {
          await apiClient.delete(`/payment/${id}`);
          message.success('删除成功');
          fetchPayables();
        } catch (error) {
          console.error('Error deleting payable:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handlePayableSubmit = async (values) => {
    try {
      // 验证数据
      const errors = validatePayableData(values);
      if (errors.length > 0) {
        message.error(errors.join('\n'));
        return;
      }

      if (editingPayable) {
        // 更新应付管理
        const editingId = editingPayable.Id || editingPayable.id;
        const updateResponse = await apiClient.put(`/payment/${editingId}`, values);
        if (updateResponse.success) {
          message.success('更新成功');
          // 更新成功后，重新获取该条记录的详细信息
          try {
            const detailResponse = await apiClient.get(`/payment/${editingId}`);
            if (detailResponse.success && detailResponse.data) {
              // 更新本地数据
              setPayables(prevPayables =>
                prevPayables.map(payable =>
                  (payable.Id || payable.id) === editingId
                    ? { ...payable, ...detailResponse.data }
                    : payable
                )
              );
              setFilteredPayables(prevFiltered =>
                prevFiltered.map(payable =>
                  (payable.Id || payable.id) === editingId
                    ? { ...payable, ...detailResponse.data }
                    : payable
                )
              );
            }
          } catch (error) {
            console.warn('更新后获取详情失败，使用通用刷新:', error);
            // 如果获取详情失败，使用通用刷新
            fetchPayables();
          }
        } else {
          message.error(updateResponse.message || '更新失败');
          return;
        }
      } else {
        // 创建新应付管理
        await apiClient.post('/payment', values);
        message.success('创建成功');
        // 创建成功后刷新列表
        fetchPayables();
      }

      setPayableModalVisible(false);
      fetchWarnings();
    } catch (error) {
      console.error('Error saving payable:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join('\n');
        message.error(`保存失败：\n${errorMessages}`);
      } else if (error.response && error.response.data && error.response.data.message) {
        message.error(`保存失败：${error.response.data.message}`);
      } else {
        message.error('保存失败');
      }
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.payableNumber) params.append('payableNumber', values.payableNumber);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.contractId) params.append('contractId', values.contractId);
      if (values.status) params.append('status', values.status);
      if (values.importance) params.append('importance', values.importance);
      if (values.urgency) params.append('urgency', values.urgency);
      if (values.paymentDueDateRange && values.paymentDueDateRange.length === 2) {
        params.append('startDate', values.paymentDueDateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.paymentDueDateRange[1].format('YYYY-MM-DD'));
      }

      const response = await apiClient.get(`/payment/search?${params.toString()}`);
      if (response.success) {
        const searchResults = response.data || [];
        const processedData = await processPayablesData(searchResults);

        setFilteredPayables(processedData);
      } else {
        message.error(response.message || '查询失败');
        setFilteredPayables([]);
      }
    } catch (error) {
      console.error('Error searching payables:', error);
      message.error('查询失败');
      setFilteredPayables([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    await fetchPayables();
  };

  const handleAddPaymentRecord = (payableId) => {
    setSelectedPayableId(payableId);
    setPaymentRecordModalVisible(true);
  };

  const handlePaymentRecordSubmit = async (values) => {
    try {
      // 验证数据
      const errors = validatePaymentRecordData(values);
      if (errors.length > 0) {
        message.error(errors.join('\n'));
        return;
      }

      const response = await apiClient.post('/payment-records', {
        paymentNumber: values.paymentNumber,
        payableManagementId: selectedPayableId,
        currencyCode: values.currencyCode,
        paymentDescription: values.paymentDescription,
        paymentAmount: values.paymentAmount,
        paymentDate: values.paymentDate ? dayjs(values.paymentDate).format('YYYY-MM-DD') : undefined,
        notes: values.notes,
      });

      console.log('创建付款记录响应:', response);

      // 检查响应结构，兼容不同的返回格式
      const isSuccess = response.success || response.data?.success;
      const responseMessage = response.message || response.data?.message;

      if (isSuccess) {
        message.success('付款记录创建成功');
        setPaymentRecordModalVisible(false);
        fetchPayables();
        fetchWarnings();
      } else {
        message.error(responseMessage || '创建付款记录失败');
      }
    } catch (error) {
      console.error('Error creating payment record:', error);
      if (error.response?.data?.message) {
        message.error(`创建付款记录失败: ${error.response.data.message}`);
      } else {
        message.error('创建付款记录失败');
      }
    }
  };

  const handleViewPaymentRecord = async (paymentRecord) => {
    try {
      const id = paymentRecord.Id || paymentRecord.id;
      console.log('正在获取付款记录详情，ID:', id);

      const response = await apiClient.get(`/payment-records/detail/${id}`);
      console.log('付款记录详情接口响应:', response);

      if (response.success) {
        const paymentRecordData = response.data;

        // 后端已经返回了附件信息，直接使用
        // 确保附件字段存在，如果没有则设为空数组
        if (!paymentRecordData.attachments) {
          paymentRecordData.attachments = [];
        }

        console.log('付款记录详情数据:', paymentRecordData);
        console.log('附件数量:', paymentRecordData.attachments?.length || 0);
        setViewingPaymentRecord(paymentRecordData);
      } else {
        console.warn('获取付款记录详情失败，使用现有数据');
        setViewingPaymentRecord(paymentRecord);
      }
    } catch (error) {
      console.warn('获取付款记录详情失败，使用现有数据:', error);
      setViewingPaymentRecord(paymentRecord);
    }
    setViewPaymentRecordModalVisible(true);
  };

  const handleEditPaymentRecord = async (paymentRecord) => {
    try {
      const id = paymentRecord.Id || paymentRecord.id;
      console.log('正在获取付款记录详情用于编辑，ID:', id);

      // 编辑时先调用后端接口获取最新数据
      const response = await apiClient.get(`/payment-records/detail/${id}`);
      console.log('编辑付款记录详情接口响应:', response);

      if (response.success) {
        const paymentRecordData = response.data;

        // 后端已经返回了附件信息，直接使用
        // 确保附件字段存在，如果没有则设为空数组
        if (!paymentRecordData.attachments) {
          paymentRecordData.attachments = [];
        }

        console.log('编辑付款记录详情数据:', paymentRecordData);
        console.log('附件数量:', paymentRecordData.attachments?.length || 0);
        setEditingPaymentRecord(paymentRecordData);
      } else {
        console.warn('获取付款记录详情失败，使用现有数据');
        setEditingPaymentRecord(paymentRecord);
      }
    } catch (error) {
      console.warn('获取付款记录详情失败，使用现有数据:', error);
      setEditingPaymentRecord(paymentRecord);
    }
    setEditPaymentRecordModalVisible(true);
  };

  const handlePaymentRecordEdit = async (values) => {
    try {
      const id = editingPaymentRecord.Id || editingPaymentRecord.id;
      if (!id) {
        message.error('无法识别要编辑的付款记录ID');
        return;
      }

      const response = await apiClient.put(`/payment-records/${id}`, values);
      if (response.success) {
        message.success('更新成功');
        setEditPaymentRecordModalVisible(false);

        // 更新成功后，重新获取该条记录的详细信息
        try {
          const detailResponse = await apiClient.get(`/payment-records/detail/${id}`);
          if (detailResponse.success && detailResponse.data) {
            // 更新本地数据中的付款记录
            setPayables(prevPayables =>
              prevPayables.map(payable => ({
                ...payable,
                paymentRecords: payable.paymentRecords?.map(pr =>
                  (pr.Id || pr.id) === id
                    ? { ...pr, ...detailResponse.data }
                    : pr
                ) || []
              }))
            );
            setFilteredPayables(prevFiltered =>
              prevFiltered.map(payable => ({
                ...payable,
                paymentRecords: payable.paymentRecords?.map(pr =>
                  (pr.Id || pr.id) === id
                    ? { ...pr, ...detailResponse.data }
                    : pr
                ) || []
              }))
            );
          }
        } catch (error) {
          console.warn('更新后获取付款记录详情失败，使用通用刷新:', error);
          // 如果获取详情失败，使用通用刷新
          fetchPayables();
        }

        fetchWarnings();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新付款记录失败:', error);
      if (error.response?.message) {
        message.error(`更新失败: ${error.response.message}`);
      } else {
        message.error('更新失败，请稍后重试');
      }
    }
  };

  const handleDeletePaymentRecord = async (paymentRecord) => {
    const id = paymentRecord.Id || paymentRecord.id;
    if (!id) {
      message.error('无法识别付款记录ID');
      return;
    }

    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个付款记录吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const response = await apiClient.delete(`/payment-records/${id}`);
          console.log('删除付款记录响应:', response);

          // 检查响应结构，兼容不同的返回格式
          const isSuccess = response.success || response.data?.success;
          const responseMessage = response.message || response.data?.message;

          if (isSuccess) {
            message.success('删除成功');
            fetchPayables();
            fetchWarnings();
          } else {
            message.error(responseMessage || '删除失败');
          }
        } catch (error) {
          console.error('删除付款记录失败:', error);
          if (error.response?.data?.message) {
            message.error(`删除失败: ${error.response.data.message}`);
          } else {
            message.error('删除失败，请稍后重试');
          }
        }
      },
    });
  };

  // 处理预警查看详情
  const handleWarningViewDetails = async (type) => {
    try {
      setLoading(true);
      let apiEndpoint = '';
      let messageText = '';
      
      switch (type) {
        case 'overdue':
          apiEndpoint = '/payment/overdue/list';
          messageText = '已过滤显示逾期付款';
          break;
        case 'upcoming':
          apiEndpoint = '/payment/upcoming/list';
          messageText = '已过滤显示7天内到期的付款';
          break;
        case 'important':
          apiEndpoint = '/payment/important/list';
          messageText = '已过滤显示重要付款';
          break;
        case 'all':
          apiEndpoint = '/payment/warnings/list';
          messageText = '已过滤显示所有预警付款';
          break;
        default:
          return;
      }
      
      // 调用接口获取过滤后的数据
      const response = await apiClient.get(apiEndpoint);
      if (response.success) {
        const filteredData = response.data || [];
        const processedData = await processPayablesData(filteredData);
        setFilteredPayables(processedData);
        message.success(messageText);
      } else {
        message.error(response.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取预警数据失败:', error);
      message.error('获取预警数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const payableColumns = getPayableColumns(
    currencies,
    handleViewDetail,
    handleEdit,
    handleAddPaymentRecord,
    handleDelete
  );

  const paymentRecordColumns = getPaymentRecordColumns(
    currencies,
    handleViewPaymentRecord,
    handleEditPaymentRecord,
    handleDeletePaymentRecord
  );

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
          <SafeTable
            columns={payableColumns}
            dataSource={filteredPayables}
            rowKey="Id"
            loading={loading}
            scroll={{ x: 1500 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              position: ['bottomCenter'],
              size: 'default'
            }}
            locale={{
              emptyText: '暂无数据'
            }}
            size="middle"
            bordered={false}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>付款记录</h4>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddPaymentRecord(record.Id || record.id)}
                    >
                      新增付款记录
                    </Button>
                  </div>
                  {record.paymentRecords && record.paymentRecords.length > 0 ? (
                    <SafeTable
                      className="payment-records-table"
                      columns={paymentRecordColumns}
                      dataSource={record.paymentRecords}
                      rowKey={(pr) => `payment-${pr.Id || pr.id}`}
                      size="small"
                      pagination={{
                        pageSize: 5,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                        position: ['bottomCenter'],
                        size: 'small'
                      }}
                      bordered={false}
                      scroll={{ x: 1200 }}
                    />
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#999',
                      padding: '40px',
                      backgroundColor: 'white',
                      border: '1px dashed #d9d9d9',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
                      <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无付款记录</div>
                      <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                        点击"新增付款记录"按钮创建第一条付款记录
                      </div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddPaymentRecord(record.Id || record.id)}
                      >
                        新增付款记录
                      </Button>
                    </div>
                  )}
                </div>
              ),
              rowExpandable: (record) => true,
            }}
          />
        </Card>

        {/* 模态框组件 */}
        <PayableModal
          visible={payableModalVisible}
          onCancel={() => setPayableModalVisible(false)}
          onSubmit={handlePayableSubmit}
          editingPayable={editingPayable}
          currencies={currencies}
          suppliers={suppliers}
          contractTreeData={contractTreeData}
          contracts={contracts}
          loading={editLoading}
        />

        <PaymentRecordModal
          visible={paymentRecordModalVisible}
          onCancel={() => setPaymentRecordModalVisible(false)}
          onSubmit={handlePaymentRecordSubmit}
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
          onAddPaymentRecord={handleAddPaymentRecord}
          onViewPaymentRecord={handleViewPaymentRecord}
          onEditPaymentRecord={handleEditPaymentRecord}
          onDeletePaymentRecord={handleDeletePaymentRecord}
          onRefresh={fetchPayables}
          currencies={currencies}
        />

        <PaymentRecordDetailModal
          visible={viewPaymentRecordModalVisible}
          onCancel={() => setViewPaymentRecordModalVisible(false)}
          viewingPaymentRecord={viewingPaymentRecord}
          onEdit={handleEditPaymentRecord}
          onRefresh={fetchPayables}
          currencies={currencies}
        />

        <PaymentRecordModal
          visible={editPaymentRecordModalVisible}
          onCancel={() => setEditPaymentRecordModalVisible(false)}
          onSubmit={handlePaymentRecordEdit}
          editingRecord={editingPaymentRecord}
          currencies={currencies}
          isEdit={true}
        />
      </div>
    </ResizeObserverFix>
  );
};

export default Payments;
