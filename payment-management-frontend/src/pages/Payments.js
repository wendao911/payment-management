import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Upload,
  message,
  Tabs,
  List,
  Avatar,
  Tooltip,
  Popconfirm,
  Divider,
  TreeSelect
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient, getBackendURL } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';
import SafeTable from '../components/SafeTable';

const { Option } = Select;
const { confirm } = Modal;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { TextArea } = Input;

const Payments = () => {
  // 添加样式
  const paymentTableStyles = `
    .payment-records-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .payment-records-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .payment-records-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .payment-records-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .payment-records-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .payment-records-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .payment-records-table .ant-table-pagination .ant-pagination-item-active a {
      color: white !important;
    }
    
    .payable-detail-modal .ant-tabs-tab {
      font-weight: 500 !important;
    }
    
    .payable-detail-modal .ant-tabs-tab-active {
      font-weight: bold !important;
    }
    
    .payment-record-card {
      transition: all 0.3s ease !important;
      border: 1px solid #f0f0f0 !important;
    }
    
    .payment-record-card:hover {
      border-color: #1890ff !important;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15) !important;
    }
    
    .payment-record-amount {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
    }
    
    /* 查询表单样式 */
    .search-form .ant-form-item-label {
      text-align: left !important;
      line-height: 32px !important;
      margin-bottom: 4px !important;
    }
    
    .search-form .ant-form-item-label > label {
      height: 32px !important;
      line-height: 32px !important;
      font-weight: 500 !important;
      color: #333 !important;
    }
    
    .search-form .ant-form-item-control {
      line-height: 32px !important;
    }
    
    .search-form .ant-form-item {
      margin-bottom: 16px !important;
    }
    
    .search-form .ant-select,
    .search-form .ant-tree-select,
    .search-form .ant-input,
    .search-form .ant-picker {
      width: 100% !important;
    }
  `;

  const [payables, setPayables] = useState([]);
  const [filteredPayables, setFilteredPayables] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayable, setEditingPayable] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPayable, setCurrentPayable] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [contractTreeData, setContractTreeData] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [paymentRecordModalVisible, setPaymentRecordModalVisible] = useState(false);
  const [selectedPayableId, setSelectedPayableId] = useState(null);
  const [paymentRecordForm] = Form.useForm();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewPaymentRecordModalVisible, setViewPaymentRecordModalVisible] = useState(false);
  const [viewingPaymentRecord, setViewingPaymentRecord] = useState(null);
  const [editPaymentRecordModalVisible, setEditPaymentRecordModalVisible] = useState(false);
  const [editPaymentRecordForm] = Form.useForm();
  const [editPaymentRecordAttachments, setEditPaymentRecordAttachments] = useState([]);
  const [loadingPaymentRecordDetail, setLoadingPaymentRecordDetail] = useState(false);

  // 根据合同ID查找合同信息的辅助函数
  const findContractById = (contracts, contractId) => {
    for (const contract of contracts) {
      if (contract.Id === contractId) {
        return contract;
      }
      // 递归查找子合同
      if (contract.children && contract.children.length > 0) {
        const found = findContractById(contract.children, contractId);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchPayables();
    fetchWarnings();
    fetchCurrencies();
    fetchSuppliers();
    fetchContracts();
  }, []);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment');
      if (response.success) {
        const payablesData = response.data || [];

        // 调试：查看应付管理数据结构
        console.log('Payables data structure:', payablesData[0]);

        // 为每个应付管理记录获取付款记录并确保数据完整性
        for (let payable of payablesData) {
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

          // 使用正确的字段名 Id（大写）
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

        setPayables(payablesData);
        setFilteredPayables(payablesData);
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
        console.log('币种数据获取成功:', response.data);
      } else {
        console.error('币种API响应失败:', response);
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
        const suppliersData = response.data || [];
        console.log('Suppliers data:', suppliersData);

        // 验证供应商数据结构
        if (suppliersData.length > 0) {
          console.log('First supplier:', suppliersData[0]);
          console.log('Supplier Name field:', suppliersData[0].Name);
          console.log('Supplier ID field:', suppliersData[0].Id);
        }

        setSuppliers(suppliersData);
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
        console.log('Contracts data:', contractsData);

        // 验证合同数据结构
        if (contractsData.length > 0) {
          console.log('First contract:', contractsData[0]);
          console.log('Contract Title field:', contractsData[0].Title);
          console.log('Contract Number field:', contractsData[0].ContractNumber);
          console.log('Contract ID field:', contractsData[0].Id);
        }

        setContracts(contractsData);

        // 后端已经返回树形结构，直接转换字段名
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

        // 调试：显示树形数据结构
        console.log('Contract tree data:', treeData);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  // 下载附件（与付款记录页面保持一致）
  const handleDownloadAttachment = async (attachment) => {
    try {
      const attachmentId = attachment?.Id || attachment?.id;
      if (!attachmentId) {
        message.error('无法识别附件ID');
        return;
      }
      const res = await apiClient.get(`/attachment/${attachmentId}/download`, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const downloadName = attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name || 'attachment';
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading attachment:', e);
      message.error('下载失败');
    }
  };

  const handleCreate = () => {
    setEditingPayable(null);
    setAttachments([]);
    form.resetFields();
    // 确保所有字段都被正确重置，币种默认为美元
    form.setFieldsValue({
      payableNumber: undefined,
      contractId: undefined,
      supplierId: undefined,
      payableAmount: undefined,
      currencyCode: 'USD', // 默认选择美元
      paymentDueDate: undefined,
      importance: undefined,
      urgency: undefined,
      description: undefined,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPayable(record);

    // 调试：查看编辑记录的数据结构
    console.log('Editing record:', record);
    console.log('Contract ID:', record.ContractId, 'Contract object:', record.contract);
    console.log('Supplier ID:', record.SupplierId, 'Supplier object:', record.supplier);
    console.log('Attachments:', record.attachments);

    // 获取应付管理的附件
    const recordId = record.Id || record.id;
    if (recordId) {
      fetchPayableAttachments(recordId);
    }

    form.setFieldsValue({
      // 确保应付编号正确设置
      payableNumber: record.PayableNumber || record.payableNumber,
      // 确保合同和供应商ID正确设置，使用正确的字段名
      contractId: record.ContractId || record.contract?.Id,
      supplierId: record.SupplierId || record.supplier?.Id,
      // 确保应付金额正确设置
      payableAmount: record.PayableAmount || record.payableAmount,
      // 确保币种正确设置
      currencyCode: record.CurrencyCode || record.currencyCode,
      // 确保付款截止日期正确设置
      paymentDueDate: record.PaymentDueDate ? dayjs(record.PaymentDueDate) : undefined,
      // 确保重要程度正确设置
      importance: record.Importance || record.importance,
      // 确保紧急程度正确设置
      urgency: record.Urgency || record.urgency,
      // 确保备注信息正确设置
      description: record.Description || record.description || '',
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (record) => {
    try {
      const recordId = record.Id || record.id;
      console.log('查看详情，记录ID:', recordId);
      const response = await apiClient.get(`/payment/${recordId}`);
      console.log('详情API响应:', response);

      // API客户端已经返回了response.data，所以这里直接检查response
      if (response.success && response.data) {
        console.log('设置应付详情数据:', response.data);
        setCurrentPayable(response.data);
        setDetailModalVisible(true);
      } else {
        console.error('无法获取应付详情数据:', response);
        message.error(response.message || '获取详情失败');
      }
    } catch (error) {
      console.error('Error fetching payable detail:', error);
      message.error('获取详情失败');
    }
  };

  // 处理文件上传 - 统一逻辑：先上传临时附件，创建成功后更新关联
  const handleFileUpload = async (file, type = 'payable') => {
    const formData = new FormData();
    formData.append('attachment', file);

    if (type === 'paymentRecord') {
      // 对于付款记录，使用临时ID上传
      formData.append('paymentId', 'temp');
    } else {
      // 对于应付管理，使用临时ID上传
      const payableId = editingPayable?.Id || editingPayable?.id || 'temp';
      formData.append('payableId', payableId);
    }

    try {
      setUploading(true);
      const response = await apiClient.post('/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // 修复：API客户端已经返回了response.data，所以这里直接检查response
      if (response.success && response.data) {
        const newAttachment = response.data;
        setAttachments(prev => [...prev, newAttachment]);
        message.success('文件上传成功');

        // 如果是在编辑模式下上传附件，刷新应付管理列表以显示新附件
        if (editingPayable?.Id || editingPayable?.id) {
          fetchPayables();
        }
      } else {
        message.error(response.message || '文件上传失败');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.data?.message) {
        message.error(`文件上传失败: ${error.response.data.message}`);
      } else {
        message.error('文件上传失败');
      }
    } finally {
      setUploading(false);
    }
  };

  // 删除附件 - 统一逻辑：所有附件都通过API删除
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      // 如果是临时附件（没有ID），直接从本地状态删除
      if (!attachmentId || attachmentId === 'temp') {
        setAttachments(prev => prev.filter(att => att.Id !== attachmentId));
        message.success('附件删除成功');
        return;
      }

      const response = await apiClient.delete(`/attachment/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data.success) {
        setAttachments(prev => prev.filter(att => att.Id !== attachmentId));
        message.success('附件删除成功');
      } else {
        message.error(response.data.message || '附件删除失败');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      message.error('附件删除失败');
    }
  };

  // 获取应付管理附件
  const fetchPayableAttachments = async (payableId) => {
    try {
      console.log('获取应付管理附件，ID:', payableId);
      const response = await apiClient.get(`/attachment/payable/${payableId}`);
      console.log('附件API响应:', response);

      // 修复：检查响应结构，兼容不同的API响应格式
      let attachmentsData = null;
      if (response.success && response.data) {
        attachmentsData = response.data;
        console.log('使用 response.data 格式');
      } else if (response.data && response.data.success) {
        attachmentsData = response.data.data;
        console.log('使用 response.data.data 格式');
      } else if (response.data) {
        attachmentsData = response.data;
        console.log('使用 response.data 直接格式');
      }

      if (attachmentsData) {
        console.log('设置附件列表:', attachmentsData);
        setAttachments(attachmentsData || []);
      } else {
        console.log('附件API响应失败，设置空数组');
        setAttachments([]);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachments([]);
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

  const handleSubmit = async (values) => {
    try {
      // 调试：查看提交的表单数据
      console.log('Form values:', values);
      console.log('Contract ID:', values.contractId);
      console.log('Supplier ID:', values.supplierId);

      // 数据类型转换和验证
      const submitData = {
        ...values,
        payableNumber: values.payableNumber,
        contractId: parseInt(values.contractId),
        supplierId: parseInt(values.supplierId),
        payableAmount: parseFloat(values.payableAmount),
        paymentDueDate: values.paymentDueDate.format('YYYY-MM-DD'),
      };

      // 验证必填字段
      if (!submitData.payableNumber || submitData.payableNumber.trim() === '') {
        message.error('请输入应付编号');
        return;
      }
      if (!submitData.contractId || isNaN(submitData.contractId)) {
        message.error('请选择有效的合同');
        return;
      }
      if (!submitData.supplierId || isNaN(submitData.supplierId)) {
        message.error('请选择有效的供应商');
        return;
      }
      if (!submitData.payableAmount || isNaN(submitData.payableAmount) || submitData.payableAmount <= 0) {
        message.error('请输入有效的应付金额');
        return;
      }
      if (!submitData.currencyCode) {
        message.error('请选择币种');
        return;
      }
      if (!submitData.paymentDueDate) {
        message.error('请选择付款截止日期');
        return;
      }

      console.log('Submit data:', submitData);
      console.log('Data types:', {
        contractId: typeof submitData.contractId,
        supplierId: typeof submitData.supplierId,
        payableAmount: typeof submitData.payableAmount,
        currencyCode: typeof submitData.currencyCode,
        paymentDueDate: typeof submitData.paymentDueDate
      });

      if (editingPayable) {
        // 更新应付管理
        const editingId = editingPayable.Id || editingPayable.id;
        await apiClient.put(`/payment/${editingId}`, submitData, {
          headers: { 'Content-Type': 'application/json' }
        });
        message.success('更新成功');

        // 刷新附件列表
        if (editingId) {
          fetchPayableAttachments(editingId);
        }
      } else {
        // 创建新应付管理
        const response = await apiClient.post('/payment', submitData, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          // 如果有附件，更新附件的payableId
          if (attachments.length > 0) {
            const payableId = response.data.data.Id || response.data.data.id;
            await Promise.all(
              attachments.map(attachment =>
                apiClient.put(`/attachment/${attachment.Id}`, {
                  payableId
                }, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                })
              )
            );
          }
          message.success('创建成功');
        }
      }

      setModalVisible(false);
      fetchPayables();
      fetchWarnings();
    } catch (error) {
      console.error('Error saving payable:', error);

      // 处理验证错误
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
        setFilteredPayables(response.data || []);
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

  const handleAddPaymentRecord = async (payableId) => {
    setSelectedPayableId(payableId);
    paymentRecordForm.resetFields();
    // 设置币种默认为美元
    paymentRecordForm.setFieldsValue({
      currencyCode: 'USD'
    });
    
    // 获取应付管理的现有附件
    try {
      const res = await apiClient.get(`/attachment/payable/${payableId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success) {
        setAttachments(res.data.data || []);
      } else {
        setAttachments([]);
      }
    } catch (e) {
      console.warn('获取应付管理附件失败:', e);
      setAttachments([]);
    }
    
    setPaymentRecordModalVisible(true);
  };

  const handlePaymentRecordSubmit = async (values) => {
    console.log('开始创建付款记录，提交的数据:', values);
    try {
      // 先创建付款记录
      const response = await apiClient.post('/payment-records', {
        paymentNumber: values.payableNumber, // 将 payableNumber 映射为 paymentNumber
        payableManagementId: selectedPayableId,
        currencyCode: values.currencyCode,
        paymentDescription: values.paymentDescription,
        paymentAmount: values.paymentAmount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        notes: values.notes,
      });

      console.log('API响应:', response.data);
      if (response.data.success) {
        const paymentRecordId = response.data.data.id;

        // 如果有附件，更新附件的关联关系
        if (attachments.length > 0) {
          try {
            await Promise.all(
              attachments.map(async (attachment) => {
                // 更新附件的paymentId关联
                const updateResponse = await apiClient.put(`/attachment/${attachment.Id}`, {
                  paymentId: paymentRecordId
                }, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  },
                });

                if (!updateResponse.data.success) {
                  console.error('附件关联更新失败:', updateResponse.data.message);
                } else {
                  console.log('附件关联更新成功:', attachment.originalFileName);
                }
              })
            );
          } catch (updateError) {
            console.error('附件关联更新过程中出现错误:', updateError);
            // 即使附件关联更新失败，也不影响付款记录的创建
          }
        }

        message.success('付款记录创建成功');
        setPaymentRecordModalVisible(false);
        setAttachments([]); // 清空附件列表
        fetchPayables(); // 重新获取数据以更新状态
        fetchWarnings(); // 重新获取预警信息
      } else {
        // 处理创建失败的情况
        message.error(response.data.message || '创建付款记录失败');
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

  // 查看单条付款记录详情
  const handleViewPaymentRecord = async (paymentRecord) => {
    try {
      const id = paymentRecord.Id || paymentRecord.id;
      const response = await apiClient.get(`/payment-records/detail/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.success) {
        const paymentRecordData = response.data.data;
        
        // 获取付款记录的附件信息
        try {
          const attachmentResponse = await apiClient.get(`/attachment/payment/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
          if (attachmentResponse.data?.success) {
            paymentRecordData.attachments = attachmentResponse.data.data || [];
          } else {
            paymentRecordData.attachments = [];
          }
        } catch (attachmentError) {
          console.warn('获取付款记录附件失败:', attachmentError);
          paymentRecordData.attachments = [];
        }
        
        setViewingPaymentRecord(paymentRecordData);
      } else {
        setViewingPaymentRecord(paymentRecord);
      }
    } catch (error) {
      console.warn('获取付款记录详情失败，使用现有数据');
      setViewingPaymentRecord(paymentRecord);
    }
    setViewPaymentRecordModalVisible(true);
  };

  // 编辑付款记录
  const handleEditPaymentRecord = async (paymentRecord) => {
    console.log('编辑付款记录:', paymentRecord);
    setEditPaymentRecordModalVisible(true);
    editPaymentRecordForm.resetFields();

    // 确保数据字段的正确映射
    const recordData = {
      paymentNumber: paymentRecord.PaymentNumber || paymentRecord.paymentNumber || '',
      currencyCode: paymentRecord.CurrencyCode || paymentRecord.currencyCode || 'USD',
      paymentDescription: paymentRecord.PaymentDescription || paymentRecord.paymentDescription || '',
      paymentAmount: paymentRecord.PaymentAmount || paymentRecord.paymentAmount || 0,
      paymentDate: paymentRecord.PaymentDate ? dayjs(paymentRecord.PaymentDate) :
        (paymentRecord.paymentDate ? dayjs(paymentRecord.paymentDate) : null),
      notes: paymentRecord.Notes || paymentRecord.notes || '',
    };

    console.log('设置表单数据:', recordData);
    editPaymentRecordForm.setFieldsValue(recordData);

    // 暂存当前编辑的记录ID在表单实例上
    const recordId = paymentRecord.Id || paymentRecord.id;
    editPaymentRecordForm.__editingId = recordId;

    // 拉取该付款记录的附件
    try {
      if (recordId) {
        const res = await apiClient.get(`/attachment/payment/${recordId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.data?.success) {
          setEditPaymentRecordAttachments(res.data.data || []);
        } else {
          setEditPaymentRecordAttachments([]);
        }
      } else {
        setEditPaymentRecordAttachments([]);
      }
    } catch (e) {
      console.warn('获取付款记录附件失败', e);
      setEditPaymentRecordAttachments([]);
    }
  };

  // 删除付款记录
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
          const response = await apiClient.delete(`/payment-records/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });

          if (response.data.success) {
            message.success('删除成功');
            // 刷新数据
            fetchPayables();
            fetchWarnings();
          } else {
            message.error(response.data.message || '删除失败');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'partial': return 'processing';
      case 'completed': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待付款';
      case 'partial': return '部分付款';
      case 'completed': return '已完成';
      case 'overdue': return '逾期';
      default: return '未知';
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'normal': return 'default';
      case 'important': return 'processing';
      case 'very_important': return 'error';
      default: return 'default';
    }
  };

  const getImportanceText = (importance) => {
    switch (importance) {
      case 'normal': return '一般';
      case 'important': return '重要';
      case 'very_important': return '非常重要';
      default: return '未知';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'normal': return 'default';
      case 'urgent': return 'processing';
      case 'very_urgent': return 'error';
      case 'overdue': return 'red';
      default: return 'default';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'normal': return '一般';
      case 'urgent': return '紧急';
      case 'very_urgent': return '非常紧急';
      case 'overdue': return '已延期';
      default: return '未知';
    }
  };

  // 以美元为基准的汇率获取（USD=1.00，CNY=7.20）
  const getExchangeRateToUSD = (currencyCode) => {
    if (!currencyCode) return 1;
    const upper = String(currencyCode).toUpperCase();
    if (upper === 'USD') return 1.0;
    if (upper === 'CNY' || upper === 'RMB') return 7.2;
    const cur = currencies.find(c => (c.Code || '').toUpperCase() === upper);
    const rate = cur?.ExchangeRate ?? cur?.exchangeRate;
    return rate && rate > 0 ? rate : 1.0;
  };

  const convertToUSD = (amount, currencyCode) => {
    const numeric = Number(amount || 0);
    const rate = getExchangeRateToUSD(currencyCode);
    if (!rate || rate <= 0) return numeric;
    // rate表示 1 USD = rate [currencyCode]
    // 因此 某币种金额 -> USD = 金额 / rate
    return numeric / rate;
  };

  const columns = [
    {
      title: '应付编号',
      dataIndex: 'PayableNumber',
      key: 'PayableNumber',
      width: 150,
    },
    {
      title: '合同编号',
      dataIndex: 'ContractNumber',
      key: 'ContractNumber',
      width: 120,
    },
    {
      title: '供应商',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
      width: 150,
    },
    {
      title: '应付金额',
      dataIndex: 'PayableAmount',
      key: 'PayableAmount',
      width: 120,
      render: (value, record) => (
        <span>
          {record.CurrencySymbol || ''}{value ? value.toLocaleString() : '0'}
        </span>
      ),
    },
    {
      title: '已付金额',
      dataIndex: 'TotalPaidAmount',
      key: 'TotalPaidAmount',
      width: 120,
      render: (value, record) => (
        <span>
          {record.CurrencySymbol || ''}{parseFloat(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '剩余金额',
      dataIndex: 'RemainingAmount',
      key: 'RemainingAmount',
      width: 120,
      render: (value, record) => (
        <span style={{ color: parseFloat(value) > 0 ? '#cf1322' : '#3f8600' }}>
          {record.CurrencySymbol || ''}{parseFloat(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '付款截止日期',
      dataIndex: 'PaymentDueDate',
      key: 'PaymentDueDate',
      width: 120,
      render: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '重要程度',
      dataIndex: 'Importance',
      key: 'Importance',
      width: 100,
      render: (value) => (
        <Tag color={getImportanceColor(value)}>
          {getImportanceText(value)}
        </Tag>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'Urgency',
      key: 'Urgency',
      width: 100,
      render: (value) => (
        <Tag color={getUrgencyColor(value)}>
          {getUrgencyText(value)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      width: 100,
      render: (value) => (
        <Tag color={getStatusColor(value)}>
          {getStatusText(value)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddPaymentRecord(record.Id || record.id)}
          >
            新增付款
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.Id || record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{paymentTableStyles}</style>

        {warnings.length > 0 && (
          <Alert
            message="付款预警"
            description={`您有 ${warnings.length} 个逾期应付需要关注`}
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

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
            <Form
              form={searchForm}
              layout="inline"
              onFinish={handleSearch}
              style={{ marginBottom: 16 }}
              size="middle"
              className="search-form"
            >
              <Row gutter={[16, 8]} style={{ width: '100%' }}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="payableNumber" label="应付编号">
                    <Input placeholder="请输入应付编号" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="supplierId" label="供应商">
                    <Select
                      placeholder="请选择供应商"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    >
                      {suppliers.map(s => (
                        <Option key={s.Id} value={s.Id}>
                          {s.Name || '未知供应商'}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={7}>
                  <Form.Item name="contractId" label="合同" >
                    <TreeSelect
                      placeholder="请选择合同（支持搜索编号/名称）"
                      treeData={contractTreeData}
                      showSearch
                      treeNodeFilterProp="title"
                      filterTreeNode={(inputValue, treeNode) => treeNode.title.toLowerCase().includes(inputValue.toLowerCase())}
                      allowClear
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 300 }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="status" label="状态">
                    <Select placeholder="请选择状态" allowClear>
                      <Option value="pending">待付款</Option>
                      <Option value="partial">部分付款</Option>
                      <Option value="completed">已完成</Option>
                      <Option value="overdue">逾期</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="importance" label="重要程度">
                    <Select placeholder="请选择重要程度" allowClear>
                      <Option value="normal">一般</Option>
                      <Option value="important">重要</Option>
                      <Option value="very_important">非常重要</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="urgency" label="紧急程度">
                    <Select placeholder="请选择紧急程度" allowClear>
                      <Option value="normal">一般</Option>
                      <Option value="urgent">紧急</Option>
                      <Option value="very_urgent">非常紧急</Option>
                      <Option value="overdue">已延期</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="paymentDueDateRange" label="付款到期日" style={{ whiteSpace: 'nowrap', marginBottom: 8 }}>
                    <RangePicker placeholder={['开始日期', '结束日期']} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item>
                    <Space>
                      <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                        查询
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={handleReset}>
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <SafeTable
            columns={columns}
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
                      columns={[
                        {
                          title: '付款编号',
                          dataIndex: 'PaymentNumber',
                          key: 'PaymentNumber',
                          width: 160,
                          render: (value, item) => (
                            <span style={{
                              fontWeight: 'bold',
                              color: '#1890ff',
                              fontFamily: 'monospace'
                            }}>
                              {value || item.paymentNumber || '-'}
                            </span>
                          ),
                        },
                        {
                          title: '付款说明',
                          dataIndex: 'PaymentDescription',
                          key: 'PaymentDescription',
                          width: 240,
                          ellipsis: true,
                          render: (value, item) => (
                            <Tooltip title={value || item.paymentDescription || '-'}>
                              <span style={{ color: '#333' }}>
                                {value || item.paymentDescription || '-'}
                              </span>
                            </Tooltip>
                          ),
                        },
                        {
                          title: '付款金额',
                          dataIndex: 'PaymentAmount',
                          key: 'PaymentAmount',
                          width: 140,
                          align: 'right',
                          render: (value, pr) => {
                            const amount = value || pr.paymentAmount || 0;
                            const currencySymbol = pr.CurrencySymbol || '';
                            return (
                              <span style={{
                                fontWeight: 'bold',
                                color: amount > 0 ? '#52c41a' : '#ff4d4f',
                                fontSize: '14px'
                              }}>
                                {currencySymbol}{amount.toLocaleString('zh-CN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            );
                          },
                        },
                        {
                          title: '金额(USD)',
                          key: 'AmountUSD',
                          width: 140,
                          align: 'right',
                          render: (_, pr) => {
                            const usd = convertToUSD(pr.PaymentAmount || pr.paymentAmount, pr.CurrencyCode || pr.currencyCode);
                            return (
                              <span style={{
                                fontWeight: 'bold',
                                color: '#1890ff',
                                fontSize: '13px'
                              }}>
                                ${usd.toFixed(2)}
                              </span>
                            );
                          }
                        },
                        {
                          title: '币种',
                          dataIndex: 'CurrencyCode',
                          key: 'CurrencyCode',
                          width: 120,
                          align: 'center',
                          render: (value, pr) => {
                            const currency = currencies.find(c => c.Code === (value || pr.currencyCode));
                            return currency ? (
                              <Tag color="blue" style={{ fontWeight: 'bold' }}>
                                {currency.Symbol} {currency.Name}
                              </Tag>
                            ) : (
                              <Tag color="default">{value || pr.currencyCode || '-'}</Tag>
                            );
                          }
                        },
                        {
                          title: '付款日期',
                          dataIndex: 'PaymentDate',
                          key: 'PaymentDate',
                          width: 140,
                          align: 'center',
                          render: (value, pr) => {
                            const date = value || pr.paymentDate;
                            if (!date) return '-';

                            const paymentDate = dayjs(date);

                            return (
                              <span style={{
                                color: '#333',
                                fontWeight: 'normal'
                              }}>
                                {paymentDate.format('YYYY-MM-DD')}
                              </span>
                            );
                          },
                        },
                        {
                          title: '创建时间',
                          dataIndex: 'CreatedAt',
                          key: 'CreatedAt',
                          width: 160,
                          align: 'center',
                          render: (value, pr) => {
                            const date = value || pr.createdAt;
                            if (!date) return '-';
                            return (
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {dayjs(date).format('YYYY-MM-DD HH:mm')}
                              </span>
                            );
                          },
                        },
                        {
                          title: '备注',
                          dataIndex: 'Notes',
                          key: 'Notes',
                          width: 220,
                          ellipsis: true,
                          render: (value, pr) => {
                            const notes = value || pr.notes;
                            return notes ? (
                              <Tooltip title={notes}>
                                <span style={{
                                  color: '#333',
                                  fontStyle: 'normal'
                                }}>
                                  {notes}
                                </span>
                              </Tooltip>
                            ) : (
                              <span style={{
                                color: '#999',
                                fontStyle: 'italic'
                              }}>
                                暂无备注
                              </span>
                            );
                          },
                        },

                        {
                          title: '操作',
                          key: 'action',
                          width: 280,
                          fixed: 'right',
                          render: (_, pr) => {
                            const recordId = pr.Id || pr.id;
                            return (
                              <Space size="small">
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewPaymentRecord(pr)}
                                >
                                  详情
                                </Button>
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditPaymentRecord(pr)}
                                  disabled={!recordId}
                                >
                                  编辑
                                </Button>
                                <Popconfirm
                                  title="确定要删除该付款记录吗？"
                                  description="删除后无法恢复，请谨慎操作"
                                  onConfirm={() => handleDeletePaymentRecord(pr)}
                                  okText="确定删除"
                                  cancelText="取消"
                                  okType="danger"
                                >
                                  <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={!recordId}
                                  >
                                    删除
                                  </Button>
                                </Popconfirm>
                              </Space>
                            );
                          }
                        }
                      ]}
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

        {/* 新增/编辑模态框 */}
        <Modal
          title={editingPayable ? '编辑应付' : '新增应付'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          {/* 调试信息 */}
          {editingPayable && console.log('编辑模式表单数据:', {
            editingPayable,
            attachments: attachments.length,
            formValues: form.getFieldsValue()
          })}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="middle"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payableNumber"
                  label="应付编号"
                  rules={[{ required: true, message: '请输入应付编号' }]}
                >
                  <Input placeholder="请输入应付编号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contractId"
                  label="合同"
                  rules={[{ required: true, message: '请选择合同' }]}
                >
                  <TreeSelect
                    placeholder="请选择合同"
                    treeData={contractTreeData}
                    showSearch
                    treeNodeFilterProp="title"
                    filterTreeNode={(inputValue, treeNode) => {
                      return treeNode.title.toLowerCase().includes(inputValue.toLowerCase());
                    }}
                    allowClear
                    treeDefaultExpandAll
                    dropdownStyle={{
                      maxHeight: 400,
                      overflow: 'auto',
                      minWidth: 300
                    }}
                    notFoundContent="未找到匹配的合同"
                    treeNodeLabelProp="title"
                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    maxTagCount={1}
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}个合同`}
                    style={{ width: '100%' }}
                    size="middle"
                    onChange={(value) => {
                      console.log('Contract selected:', value);
                      // 根据选择的合同自动设置供应商
                      if (value) {
                        const selectedContract = findContractById(contracts, value);
                        if (selectedContract && selectedContract.SupplierId) {
                          console.log('Auto-setting supplier:', selectedContract.SupplierId);
                          form.setFieldsValue({ supplierId: selectedContract.SupplierId });
                        }
                      } else {
                        // 当合同被清除时，也清除供应商
                        console.log('Contract cleared, clearing supplier');
                        form.setFieldsValue({ supplierId: undefined });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="supplierId"
                  label="供应商"
                  rules={[{ required: true, message: '请选择供应商' }]}
                >
                  <Select
                    placeholder="请选择供应商"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    notFoundContent="未找到匹配的供应商"
                    onChange={(value) => {
                      console.log('Supplier selected:', value);
                      console.log('Form values after selection:', form.getFieldsValue());
                    }}
                    disabled={form.getFieldValue('contractId') && findContractById(contracts, form.getFieldValue('contractId'))?.SupplierId}
                  >
                    {suppliers.map(supplier => (
                      <Option key={supplier.Id} value={supplier.Id}>
                        {supplier.Name || '未知供应商'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currencyCode"
                  label="币种"
                  rules={[{ required: true, message: '请选择币种' }]}
                >
                  <Select placeholder="请选择币种">
                    {currencies.map(currency => (
                      <Option key={currency.Code} value={currency.Code}>
                        {currency.Symbol} {currency.Name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payableAmount"
                  label="应付金额"
                  rules={[
                    { required: true, message: '请输入应付金额' },
                    { type: 'number', min: 0.01, message: '应付金额必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="urgency"
                  label="紧急程度"
                >
                  <Select placeholder="请选择紧急程度">
                    <Option value="normal">一般</Option>
                    <Option value="urgent">紧急</Option>
                    <Option value="very_urgent">非常紧急</Option>
                    <Option value="overdue">已延期</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="paymentDueDate"
              label="付款截止日期"
              rules={[{ required: true, message: '请选择付款截止日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="importance"
              label="重要程度"
            >
              <Select placeholder="请选择重要程度">
                <Option value="normal">一般</Option>
                <Option value="important">重要</Option>
                <Option value="very_important">非常重要</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="备注"
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item label="附件">
              <div style={{
                border: '1px dashed #d9d9d9',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <Upload
                    beforeUpload={(file) => {
                      const isLt10M = file.size / 1024 / 1024 < 10;
                      if (!isLt10M) {
                        message.error('文件大小不能超过10MB!');
                        return false;
                      }
                      handleFileUpload(file);
                      return false; // 阻止自动上传
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} type="dashed" style={{ width: '100%' }}>
                      选择文件
                    </Button>
                  </Upload>
                  <div style={{
                    marginTop: '8px',
                    color: '#999',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    支持多个文件，单个文件不超过10MB，非必传
                  </div>
                </div>

                {/* 显示已上传的附件列表 */}
                {attachments.length > 0 && (
                  <div>
                    <div style={{
                      marginBottom: '12px',
                      fontWeight: 'bold',
                      color: '#1890ff',
                      fontSize: '14px'
                    }}>
                      已上传附件 ({attachments.length} 个)
                    </div>
                    <List
                      size="small"
                      dataSource={attachments}
                      renderItem={(attachment) => (
                        <List.Item
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            border: '1px solid #f0f0f0'
                          }}
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadAttachment(attachment)}
                              style={{ padding: '4px 8px' }}
                            >
                              下载
                            </Button>,
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={() => handleDeleteAttachment(attachment.Id)}
                              style={{ padding: '4px 8px' }}
                            >
                              删除
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                            title={
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#333'
                              }}>
                                {attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name}
                              </span>
                            }
                            description={
                              <span style={{
                                fontSize: '12px',
                                color: '#666',
                                lineHeight: '1.4'
                              }}>
                                大小：{((attachment.FileSize || attachment.fileSize || attachment.size || 0) / 1024).toFixed(2)} KB |
                                上传时间：{dayjs(attachment.CreatedAt || attachment.uploadTime || attachment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                              </span>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </div>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingPayable ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 详情模态框 */}
        <Modal
          title="应付详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={1200}
          className="payable-detail-modal"
          destroyOnClose
        >
          {/* 调试信息 */}
          {currentPayable && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>应付编号：</strong>{currentPayable.PayableNumber}</p>
                    <p><strong>合同编号：</strong>{currentPayable.ContractNumber}</p>
                    <p><strong>合同标题：</strong>{currentPayable.ContractTitle || '无标题'}</p>
                    <p><strong>供应商：</strong>{currentPayable.SupplierName || '未知供应商'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>应付金额：</strong>{currentPayable.CurrencySymbol}{currentPayable.PayableAmount?.toLocaleString()}</p>
                    <p><strong>币种：</strong>{currentPayable.CurrencyName}</p>
                    <p><strong>付款截止日期：</strong>{dayjs(currentPayable.PaymentDueDate).format('YYYY-MM-DD')}</p>
                    <p><strong>状态：</strong>
                      <Tag color={getStatusColor(currentPayable.Status)}>
                        {getStatusText(currentPayable.Status)}
                      </Tag>
                    </p>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>重要程度：</strong>
                      <Tag color={getImportanceColor(currentPayable.Importance)}>
                        {getImportanceText(currentPayable.Importance)}
                      </Tag>
                    </p>
                  </Col>
                  <Col span={12}>
                    <p><strong>紧急程度：</strong>
                      <Tag color={getUrgencyColor(currentPayable.Urgency)}>
                        {getUrgencyText(currentPayable.Urgency)}
                      </Tag>
                    </p>
                  </Col>
                </Row>
                {currentPayable.Description && (
                  <>
                    <Divider />
                    <p><strong>备注：</strong></p>
                    <p>{currentPayable.Description}</p>
                  </>
                )}
              </TabPane>

              <TabPane tab="付款记录" key="2">
                {/* 付款记录统计信息 */}
                {currentPayable.paymentRecords && currentPayable.paymentRecords.length > 0 && (
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>总记录数</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                          {currentPayable.paymentRecords.length}
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>已付总额</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                          {currentPayable.CurrencySymbol || ''}
                          {currentPayable.paymentRecords.reduce((sum, item) =>
                            sum + (parseFloat(item.PaymentAmount || item.paymentAmount || 0)), 0
                          ).toLocaleString('zh-CN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>剩余金额</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cf1322' }}>
                          {currentPayable.CurrencySymbol || ''}
                          {(parseFloat(currentPayable.PayableAmount || 0) -
                            currentPayable.paymentRecords.reduce((sum, item) =>
                              sum + (parseFloat(item.PaymentAmount || item.paymentAmount || 0)), 0
                            )
                          ).toLocaleString('zh-CN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>完成进度</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                          {Math.round(
                            (currentPayable.paymentRecords.reduce((sum, item) =>
                              sum + (parseFloat(item.PaymentAmount || item.paymentAmount || 0)), 0
                            ) / parseFloat(currentPayable.PayableAmount || 1)) * 100
                          )}%
                        </div>
                      </Card>
                    </Col>
                  </Row>
                )}

                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const payableId = currentPayable.Id || currentPayable.id;
                      setSelectedPayableId(payableId);
                      paymentRecordForm.resetFields();
                      // 设置币种默认为美元
                      paymentRecordForm.setFieldsValue({
                        currencyCode: 'USD'
                      });
                      setAttachments([]); // 重置附件列表
                      setPaymentRecordModalVisible(true);
                      setDetailModalVisible(false);
                    }}
                  >
                    新增付款记录
                  </Button>
                </div>

                {currentPayable.paymentRecords && currentPayable.paymentRecords.length > 0 ? (
                  <div>
                    {currentPayable.paymentRecords.map((item, index) => (
                      <Card
                        key={item.Id || item.id || index}
                        size="small"
                        style={{ marginBottom: 12 }}
                        bodyStyle={{ padding: '12px' }}
                        className="payment-record-card"
                      >
                        <Row gutter={16} align="middle">
                          <Col span={14}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Avatar
                                icon={<DollarOutlined />}
                                style={{ backgroundColor: '#52c41a' }}
                              />
                              <div>
                                <div style={{
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  color: '#1890ff',
                                  marginBottom: '4px'
                                }}>
                                  {item.PaymentNumber || item.paymentNumber || `付款记录-${index + 1}`}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: '#666',
                                  marginBottom: '4px'
                                }}>
                                  {item.PaymentDescription || item.paymentDescription || '无说明'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                  付款日期：{dayjs(item.PaymentDate || item.paymentDate).format('YYYY-MM-DD')} |
                                  备注：{item.Notes || item.notes || '无'}
                                </div>
                              </div>
                            </div>
                          </Col>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: '#52c41a',
                              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                            }}>
                              {(item.CurrencySymbol || '')}
                              {(item.PaymentAmount || item.paymentAmount || 0).toLocaleString('zh-CN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {item.CurrencyCode || item.currencyCode || 'USD'}
                            </div>
                          </Col>
                          <Col span={6} style={{ textAlign: 'right' }}>
                            <Space size="small">
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                loading={loadingPaymentRecordDetail}
                                onClick={async () => {
                                  try {
                                    setLoadingPaymentRecordDetail(true);
                                    const recordId = item.Id || item.id;
                                    // 调用API获取付款记录详情
                                    const response = await apiClient.get(`/payment-records/detail/${recordId}`, {
                                      headers: {
                                        Authorization: `Bearer ${localStorage.getItem('token')}`
                                      }
                                    });

                                    if (response.data.success) {
                                      const paymentRecordData = response.data.data;
                                      
                                      // 获取付款记录的附件信息
                                      try {
                                        const attachmentResponse = await apiClient.get(`/attachment/payment/${recordId}`, {
                                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                        });
                                        if (attachmentResponse.data?.success) {
                                          paymentRecordData.attachments = attachmentResponse.data.data || [];
                                        } else {
                                          paymentRecordData.attachments = [];
                                        }
                                      } catch (attachmentError) {
                                        console.warn('获取付款记录附件失败:', attachmentError);
                                        paymentRecordData.attachments = [];
                                      }
                                      
                                      setViewingPaymentRecord(paymentRecordData);
                                      setViewPaymentRecordModalVisible(true);
                                      setDetailModalVisible(false);
                                    } else {
                                      message.error('获取付款记录详情失败');
                                    }
                                  } catch (error) {
                                    console.error('获取付款记录详情失败:', error);
                                    message.error('获取付款记录详情失败');
                                    setLoadingPaymentRecordDetail(false);
                                  } finally {
                                    setLoadingPaymentRecordDetail(false);
                                  }
                                }}
                              >
                                详情
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  handleEditPaymentRecord(item);
                                  setDetailModalVisible(false);
                                }}
                              >
                                编辑
                              </Button>
                              <Popconfirm
                                title="确定要删除该付款记录吗？"
                                description="删除后无法恢复，请谨慎操作"
                                onConfirm={() => {
                                  handleDeletePaymentRecord(item);
                                  // 重新获取详情数据
                                  handleViewDetail(currentPayable);
                                }}
                                okText="确定删除"
                                cancelText="取消"
                                okType="danger"
                              >
                                <Button
                                  type="link"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                >
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '40px',
                    backgroundColor: '#fafafa',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无付款记录</div>
                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                      点击"新增付款记录"按钮创建第一条付款记录
                    </div>
                  </div>
                )}
              </TabPane>

              <TabPane tab="附件" key="3">
                <div style={{
                  border: '1px dashed #d9d9d9',
                  borderRadius: '6px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Upload
                      name="attachments"
                      action={`${getBackendURL()}/payment/${currentPayable.Id || currentPayable.id}/attachments`}
                      multiple
                      headers={{
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                      }}
                      onChange={(info) => {
                        if (info.file.status === 'done') {
                          message.success(`${info.file.name} 上传成功`);
                          // 重新获取详情数据以显示新上传的附件
                          handleViewDetail(currentPayable);
                        } else if (info.file.status === 'error') {
                          message.error(`${info.file.name} 上传失败`);
                        }
                      }}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />} type="dashed" style={{ width: '100%' }}>
                        上传附件
                      </Button>
                    </Upload>
                    <div style={{
                      marginTop: '8px',
                      color: '#999',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      支持多个文件，单个文件不超过10MB
                    </div>
                  </div>
                </div>

                {currentPayable.attachments && currentPayable.attachments.length > 0 ? (
                  <div>
                    <div style={{
                      marginBottom: '12px',
                      fontWeight: 'bold',
                      color: '#1890ff',
                      fontSize: '14px'
                    }}>
                      已上传附件 ({currentPayable.attachments.length} 个)
                    </div>
                    <List
                      dataSource={currentPayable.attachments}
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            border: '1px solid #f0f0f0'
                          }}
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadAttachment(item)}
                              style={{ padding: '4px 8px' }}
                            >
                              下载
                            </Button>,
                            <Popconfirm
                              title="确定要删除这个附件吗？"
                              onConfirm={async () => {
                                try {
                                  const payableId = currentPayable.Id || currentPayable.id;
                                  const attachmentId = item.Id || item.id;
                                  await apiClient.delete(`/payment/${payableId}/attachments/${attachmentId}`);
                                  message.success('删除成功');
                                  // 重新获取详情数据
                                  handleViewDetail(currentPayable);
                                } catch (error) {
                                  console.error('Error deleting attachment:', error);
                                  message.error('删除失败');
                                }
                              }}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>
                                删除
                              </Button>
                            </Popconfirm>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                            title={
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#333'
                              }}>
                                {item.OriginalFileName || item.originalFileName || item.FileName || item.name}
                              </span>
                            }
                            description={
                              <span style={{
                                fontSize: '12px',
                                color: '#666',
                                lineHeight: '1.4'
                              }}>
                                大小：{((item.FileSize || item.fileSize || item.size || 0) / 1024).toFixed(2)} KB |
                                上传时间：{dayjs(item.CreatedAt || item.uploadTime || item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                              </span>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '40px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                    <div>暂无附件</div>
                  </div>
                )}
              </TabPane>
            </Tabs>
          )}
        </Modal>

        {/* 查看付款记录详情模态框 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EyeOutlined style={{ color: '#1890ff' }} />
              付款记录详情
            </div>
          }
          open={viewPaymentRecordModalVisible}
          onCancel={() => setViewPaymentRecordModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewPaymentRecordModalVisible(false)}>
              关闭
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setViewPaymentRecordModalVisible(false);
                handleEditPaymentRecord(viewingPaymentRecord);
              }}
            >
              编辑记录
            </Button>
          ]}
          width={1200}
          destroyOnClose
        >
          {loadingPaymentRecordDetail ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '16px' }}>正在加载付款记录详情...</div>
            </div>
          ) : viewingPaymentRecord ? (
            <div style={{ padding: '16px' }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Card size="small" title="基本信息" style={{ marginBottom: '16px' }}>
                    <Row gutter={[8, 12]}>
                      <Col span={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>付款编号：</strong>
                          <span style={{
                            color: '#1890ff',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                          }}>
                            {viewingPaymentRecord.PaymentNumber || viewingPaymentRecord.paymentNumber || '-'}
                          </span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>币种：</strong>
                          <Tag color="blue" style={{ fontWeight: 'bold' }}>
                            {viewingPaymentRecord.CurrencyCode || viewingPaymentRecord.currencyCode || '-'}
                          </Tag>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>付款说明：</strong>
                          <div style={{
                            marginTop: '4px',
                            padding: '8px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9'
                          }}>
                            {viewingPaymentRecord.PaymentDescription || viewingPaymentRecord.paymentDescription || '-'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="金额信息" style={{ marginBottom: '16px' }}>
                    <Row gutter={[8, 12]}>
                      <Col span={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>付款金额：</strong>
                          <div style={{
                            marginTop: '4px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#52c41a'
                          }}>
                            {(viewingPaymentRecord.CurrencySymbol || '')}
                            {(viewingPaymentRecord.PaymentAmount || viewingPaymentRecord.paymentAmount || 0).toLocaleString('zh-CN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>美元等值：</strong>
                          <div style={{
                            marginTop: '4px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1890ff'
                          }}>
                            ${convertToUSD(
                              viewingPaymentRecord.PaymentAmount || viewingPaymentRecord.paymentAmount,
                              viewingPaymentRecord.CurrencyCode || viewingPaymentRecord.currencyCode
                            ).toFixed(2)}
                          </div>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>付款日期：</strong>
                          <div style={{
                            marginTop: '4px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            {dayjs(viewingPaymentRecord.PaymentDate || viewingPaymentRecord.paymentDate).format('YYYY年MM月DD日')}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Card size="small" title="备注信息" style={{ marginBottom: '16px' }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fafafa',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                      minHeight: '60px'
                    }}>
                      {viewingPaymentRecord.Notes || viewingPaymentRecord.notes ? (
                        <span style={{ color: '#333', lineHeight: '1.6' }}>
                          {viewingPaymentRecord.Notes || viewingPaymentRecord.notes}
                        </span>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>
                          暂无备注信息
                        </span>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Card size="small" title="时间信息">
                    <Row gutter={[8, 12]}>
                      <Col span={24}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>创建时间：</strong>
                          <div style={{ marginTop: '4px', color: '#333' }}>
                            {dayjs(viewingPaymentRecord.CreatedAt || viewingPaymentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        </div>
                      </Col>
                      {viewingPaymentRecord.UpdatedAt && (
                        <Col span={24}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#666' }}>更新时间：</strong>
                            <div style={{ marginTop: '4px', color: '#333' }}>
                              {dayjs(viewingPaymentRecord.UpdatedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="附件信息">
                    {viewingPaymentRecord.attachments && viewingPaymentRecord.attachments.length > 0 ? (
                      <div>
                        <div style={{
                          marginBottom: '12px',
                          color: '#1890ff',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          已上传附件 ({viewingPaymentRecord.attachments.length} 个)
                        </div>
                        <List
                          size="small"
                          dataSource={viewingPaymentRecord.attachments}
                          renderItem={(att) => (
                            <List.Item
                              style={{
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                border: '1px solid #f0f0f0'
                              }}
                              actions={[
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleDownloadAttachment(att)}
                                  style={{ padding: '4px 8px' }}
                                >
                                  下载
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                                title={
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#333'
                                  }}>
                                    {att.OriginalFileName || att.originalFileName || att.FileName || att.name || '未知文件'}
                                  </span>
                                }
                                description={
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    lineHeight: '1.4'
                                  }}>
                                    大小：{((att.FileSize || att.fileSize || att.size || 0) / 1024).toFixed(2)} KB |
                                    上传时间：{dayjs(att.CreatedAt || att.uploadTime || att.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                  </span>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: '#999',
                        padding: '40px',
                        border: '1px dashed #d9d9d9',
                        borderRadius: '6px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                        <div>暂无附件</div>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '16px' }}>暂无付款记录详情数据</div>
            </div>
          )}
        </Modal>

        {/* 编辑付款记录模态框 */}
        <Modal
          title="编辑付款记录"
          open={editPaymentRecordModalVisible}
          onCancel={() => setEditPaymentRecordModalVisible(false)}
          footer={null}
          width={700}
          destroyOnClose
        >
          <Form
            form={editPaymentRecordForm}
            layout="vertical"
            onFinish={async (values) => {
              try {
                const id = editPaymentRecordForm.__editingId;
                if (!id) {
                  message.error('无法识别要编辑的付款记录ID');
                  return;
                }

                console.log('提交编辑数据:', values);

                const payload = {
                  paymentNumber: values.paymentNumber,
                  currencyCode: values.currencyCode,
                  paymentDescription: values.paymentDescription,
                  paymentAmount: parseFloat(values.paymentAmount),
                  paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
                  notes: values.notes,
                };

                const response = await apiClient.put(`/payment-records/${id}`, payload, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  },
                });

                if (response.success) {
                  message.success('更新成功');
                  setEditPaymentRecordModalVisible(false);
                  // 刷新数据
                  fetchPayables();
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
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentNumber"
                  label="付款编号"
                  rules={[{ required: true, message: '请输入付款编号' }]}
                >
                  <Input placeholder="请输入付款编号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currencyCode"
                  label="币种"
                  rules={[{ required: true, message: '请选择币种' }]}
                >
                  <Select placeholder="请选择币种">
                    {currencies.map(currency => (
                      <Option key={currency.Code} value={currency.Code}>
                        {currency.Symbol} {currency.Name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentDescription"
                  label="付款说明"
                  rules={[
                    { required: true, message: '请输入付款说明' },
                    { min: 5, message: '付款说明至少5个字符' },
                    { max: 200, message: '付款说明不能超过200个字符' }
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="请输入付款说明，如：项目进度款、材料采购款等"
                    showCount
                    maxLength={200}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="paymentAmount"
                  label="付款金额"
                  rules={[
                    { required: true, message: '请输入付款金额' },
                    {
                      validator: (_, value) => {
                        if (!value || value === '') {
                          return Promise.reject(new Error('请输入付款金额'));
                        }
                        if (isNaN(parseFloat(value))) {
                          return Promise.reject(new Error('请输入有效的数字'));
                        }
                        if (parseFloat(value) <= 0) {
                          return Promise.reject(new Error('付款金额必须大于0'));
                        }
                        if (parseFloat(value) > 999999999.99) {
                          return Promise.reject(new Error('付款金额不能超过999,999,999.99'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入付款金额"
                    precision={2}
                    min={0.01}
                    max={999999999.99}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/(,*)/g, '')}
                    addonAfter={
                      <span style={{ color: '#666' }}>
                        {editPaymentRecordForm.getFieldValue('currencyCode') || 'USD'}
                      </span>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentDate"
                  label="付款日期"
                  rules={[
                    { required: true, message: '请选择付款日期' },
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.reject(new Error('请选择付款日期'));
                        }
                        const selectedDate = dayjs(value);
                        const today = dayjs();
                        if (selectedDate.isAfter(today, 'day')) {
                          return Promise.reject(new Error('付款日期不能超过今天'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="请选择付款日期"
                    disabledDate={(current) => {
                      // 禁用未来日期
                      return current && current > dayjs().endOf('day');
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="notes"
                  label="备注信息"
                  rules={[
                    { max: 500, message: '备注信息不能超过500个字符' }
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="请输入备注信息，如：付款原因、特殊说明等"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>

            {editPaymentRecordForm.__editingId && (
              <Form.Item label="附件管理">
                <div style={{
                  border: '1px dashed #d9d9d9',
                  borderRadius: '6px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Upload
                      name="attachments"
                      action={`${getBackendURL()}/attachment`}
                      multiple
                      headers={{
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                      }}
                      data={{
                        relatedTable: 'PaymentRecords',
                        relatedId: editPaymentRecordForm.__editingId
                      }}
                      onChange={async (info) => {
                        if (info.file.status === 'done') {
                          message.success(`${info.file.name} 上传成功`);
                          try {
                            const res = await apiClient.get(`/attachment/payment/${editPaymentRecordForm.__editingId}`, {
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                            });
                            if (res.data?.success) {
                              setEditPaymentRecordAttachments(res.data.data || []);
                            }
                          } catch (e) {
                            console.warn('刷新附件列表失败:', e);
                          }
                          // 刷新主数据
                          fetchPayables();
                        } else if (info.file.status === 'error') {
                          message.error(`${info.file.name} 上传失败`);
                        }
                      }}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />} type="dashed" style={{ width: '100%' }}>
                        上传新附件
                      </Button>
                    </Upload>
                    <div style={{
                      marginTop: '8px',
                      color: '#999',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      支持多个文件，单个文件不超过10MB
                    </div>
                  </div>

                  {editPaymentRecordAttachments.length > 0 ? (
                    <div>
                      <div style={{
                        marginBottom: '12px',
                        fontWeight: 'bold',
                        color: '#1890ff',
                        fontSize: '14px'
                      }}>
                        已上传附件 ({editPaymentRecordAttachments.length} 个)
                      </div>
                      <List
                        size="small"
                        dataSource={editPaymentRecordAttachments}
                        renderItem={(att) => (
                          <List.Item
                            style={{
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              marginBottom: '8px',
                              border: '1px solid #f0f0f0'
                            }}
                            actions={[
                              <Button
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownloadAttachment(att)}
                                style={{ padding: '4px 8px' }}
                              >
                                下载
                              </Button>,
                              <Popconfirm
                                title="确定要删除该附件吗？"
                                description="删除后无法恢复"
                                onConfirm={async () => {
                                  try {
                                    const response = await apiClient.delete(`/attachment/${att.Id}`, {
                                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                    });
                                    if (response.data.success) {
                                      message.success('删除成功');
                                      setEditPaymentRecordAttachments(prev => prev.filter(a => a.Id !== att.Id));
                                      // 刷新主数据
                                      fetchPayables();
                                    } else {
                                      message.error(response.data.message || '删除失败');
                                    }
                                  } catch (e) {
                                    console.error('删除附件失败:', e);
                                    message.error('删除失败，请稍后重试');
                                  }
                                }}
                                okText="确定删除"
                                cancelText="取消"
                                okType="danger"
                              >
                                <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>
                                  删除
                                </Button>
                              </Popconfirm>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                              title={
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#333'
                                }}>
                                  {att.OriginalFileName || att.originalFileName || att.FileName || att.name || '未知文件'}
                                </span>
                              }
                              description={
                                <span style={{
                                  fontSize: '12px',
                                  color: '#666',
                                  lineHeight: '1.4'
                                }}>
                                  大小：{((att.FileSize || att.fileSize || att.size || 0) / 1024).toFixed(2)} KB |
                                  上传时间：{dayjs(att.CreatedAt || att.uploadTime || att.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#999',
                      padding: '40px',
                      border: '1px dashed #d9d9d9',
                      borderRadius: '6px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                      <div>暂无附件</div>
                    </div>
                  )}
                </div>
              </Form.Item>
            )}

            <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setEditPaymentRecordModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  保存更改
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 新增付款记录模态框 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusOutlined style={{ color: '#52c41a' }} />
              新增付款记录
            </div>
          }
          open={paymentRecordModalVisible}
          onCancel={() => setPaymentRecordModalVisible(false)}
          footer={null}
          width={700}
          destroyOnClose
        >
          <Form
            form={paymentRecordForm}
            layout="vertical"
            onFinish={handlePaymentRecordSubmit}
            size="middle"
            initialValues={{
              currencyCode: 'USD',
              paymentDate: dayjs()
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payableNumber"
                  label="付款编号"
                  rules={[
                    { required: true, message: '请输入付款编号' },
                    { min: 3, message: '付款编号至少3个字符' },
                    { max: 50, message: '付款编号不能超过50个字符' }
                  ]}
                >
                  <Input
                    placeholder="请输入付款编号，如：PAY-2024-001"
                    showCount
                    maxLength={50}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currencyCode"
                  label="币种"
                  rules={[{ required: true, message: '请选择币种' }]}
                >
                  <Select
                    placeholder="请选择币种"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {currencies.map(currency => (
                      <Option key={currency.Code} value={currency.Code}>
                        <span style={{ fontWeight: 'bold' }}>
                          {currency.Symbol} {currency.Name}
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentDescription"
                  label="付款说明"
                  rules={[
                    { required: true, message: '请输入付款说明' },
                    { min: 5, message: '付款说明至少5个字符' },
                    { max: 200, message: '付款说明不能超过200个字符' }
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="请输入付款说明，如：项目进度款、材料采购款等"
                    showCount
                    maxLength={200}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="paymentAmount"
                  label="付款金额"
                  rules={[
                    { required: true, message: '请输入付款金额' },
                    {
                      validator: (_, value) => {
                        if (!value || value === '') {
                          return Promise.reject(new Error('请输入付款金额'));
                        }
                        if (isNaN(parseFloat(value))) {
                          return Promise.reject(new Error('请输入有效的数字'));
                        }
                        if (parseFloat(value) <= 0) {
                          return Promise.reject(new Error('付款金额必须大于0'));
                        }
                        if (parseFloat(value) > 999999999.99) {
                          return Promise.reject(new Error('付款金额不能超过999,999,999.99'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入付款金额"
                    precision={2}
                    min={0.01}
                    max={999999999.99}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/(,*)/g, '')}
                    addonAfter={
                      <span style={{ color: '#666' }}>
                        {paymentRecordForm.getFieldValue('currencyCode') || 'USD'}
                      </span>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentDate"
                  label="付款日期"
                  rules={[
                    { required: true, message: '请选择付款日期' },
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.reject(new Error('请选择付款日期'));
                        }
                        const selectedDate = dayjs(value);
                        const today = dayjs();
                        if (selectedDate.isAfter(today, 'day')) {
                          return Promise.reject(new Error('付款日期不能超过今天'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="请选择付款日期"
                    disabledDate={(current) => {
                      // 禁用未来日期
                      return current && current > dayjs().endOf('day');
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="notes"
                  label="备注信息"
                  rules={[
                    { max: 500, message: '备注信息不能超过500个字符' }
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="请输入备注信息，如：付款原因、特殊说明等"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="附件上传">
              <div style={{
                border: '1px dashed #d9d9d9',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <Upload
                    name="attachments"
                    action={`${getBackendURL()}/attachment`}
                    multiple
                    headers={{
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }}
                    data={{
                      relatedTable: 'PayableManagement',
                      relatedId: selectedPayableId,
                      type: 'paymentRecord'
                    }}
                    onChange={async (info) => {
                      if (info.file.status === 'done') {
                        message.success(`${info.file.name} 上传成功`);
                        // 刷新附件列表
                        if (info.file.response?.data) {
                          setAttachments(prev => [...prev, info.file.response.data]);
                        }
                        // 重新获取应付管理的附件列表
                        try {
                          const res = await apiClient.get(`/attachment/payable/${selectedPayableId}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                          });
                          if (res.data?.success) {
                            setAttachments(res.data.data || []);
                          }
                        } catch (e) {
                          console.warn('刷新附件列表失败:', e);
                        }
                      } else if (info.file.status === 'error') {
                        message.error(`${info.file.name} 上传失败`);
                      }
                    }}
                    beforeUpload={(file) => {
                      const isLt10M = file.size / 1024 / 1024 < 10;
                      if (!isLt10M) {
                        message.error('文件大小不能超过10MB!');
                        return false;
                      }
                      return true;
                    }}
                    showUploadList={{
                      showPreviewIcon: false,
                      showRemoveIcon: true,
                      showDownloadIcon: false
                    }}
                  >
                    <Button icon={<UploadOutlined />} type="dashed" style={{ width: '100%' }}>
                      选择文件
                    </Button>
                  </Upload>
                  <div style={{
                    marginTop: '8px',
                    color: '#999',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    支持多个文件，单个文件不超过10MB，非必传
                  </div>
                </div>
              </div>

              {attachments.length > 0 && (
                <div>
                  <div style={{
                    marginBottom: '12px',
                    fontWeight: 'bold',
                    color: '#1890ff',
                    fontSize: '14px'
                  }}>
                    已上传附件 ({attachments.length} 个)
                  </div>
                  <List
                    size="small"
                    dataSource={attachments}
                    renderItem={(att) => (
                      <List.Item
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          border: '1px solid #f0f0f0'
                        }}
                        actions={[
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadAttachment(att)}
                            style={{ padding: '4px 8px' }}
                          >
                            下载
                          </Button>,
                          <Popconfirm
                            title="确定要删除该附件吗？"
                            description="删除后无法恢复"
                            onConfirm={async () => {
                              try {
                                const response = await apiClient.delete(`/attachment/${att.Id}`, {
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                });
                                if (response.data.success) {
                                  setAttachments(prev => prev.filter(a => a.Id !== att.Id));
                                  message.success('附件删除成功');
                                } else {
                                  message.error(response.data.message || '删除失败');
                                }
                              } catch (e) {
                                console.error('删除附件失败:', e);
                                message.error('删除失败，请稍后重试');
                              }
                            }}
                            okText="确定删除"
                            cancelText="取消"
                            okType="danger"
                          >
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>
                              删除
                            </Button>
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                          title={
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#333'
                            }}>
                              {att.OriginalFileName || att.originalFileName || att.FileName || att.name || '未知文件'}
                            </span>
                          }
                          description={
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              lineHeight: '1.4'
                            }}>
                              大小：{((att.FileSize || att.fileSize || att.size || 0) / 1024).toFixed(2)} KB |
                              上传时间：{dayjs(att.CreatedAt || att.uploadTime || att.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Form.Item>

            <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setPaymentRecordModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={uploading}
                  icon={<PlusOutlined />}
                >
                  创建付款记录
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ResizeObserverFix>
  );
};

export default Payments;
