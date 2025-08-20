import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Card,
  message,
  Tag,
  Row,
  Col,
  Upload,
  List,
  Popconfirm,
  Statistic,
  TreeSelect,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, UploadOutlined, FileTextOutlined, DownloadOutlined, FileTextOutlined as FileIcon, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';

const { Option } = Select;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

// 自定义样式
const treeTableStyles = {
  '.ant-table-row-expand-icon': {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
    color: 'white',
  },
  '.ant-table-row-expand-icon-expanded': {
    backgroundColor: '#52c41a',
    borderColor: '#52c41a',
  },
  '.ant-table-expanded-row': {
    backgroundColor: '#f8f9fa',
    borderLeft: '3px solid #1890ff',
  },
  '.ant-table-row:hover': {
    backgroundColor: '#f0f8ff',
  },
  '.parent-contract': {
    backgroundColor: '#f0f8ff',
    borderLeft: '4px solid #1890ff',
  },
  '.child-contract': {
    backgroundColor: '#fafafa',
    borderLeft: '2px solid #d9d9d9',
  },
};

const Contracts = () => {
  // 添加样式
  const contractTableStyles = `
    .contract-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .contract-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .contract-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .contract-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .contract-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .contract-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .contract-table .ant-table-pagination .ant-pagination-item-active a {
      color: white !important;
    }
    
    .parent-contract {
      background-color: #f0f8ff !important;
      border-left: 4px solid #1890ff !important;
    }
    
    .child-contract {
      background-color: #fafafa !important;
      border-left: 2px solid #d9d9d9 !important;
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
    .search-form .ant-input,
    .search-form .ant-picker {
      width: 100% !important;
    }
  `;

  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContracts();
    fetchSuppliers();
  }, []);

  // 预处理合同数据，将空的 children 数组改为 undefined
  const preprocessContractData = (data) => {
    return data.map(contract => {
      const processedContract = { ...contract };
      if (contract.children && Array.isArray(contract.children) && contract.children.length === 0) {
        processedContract.children = undefined;
      } else if (contract.children && Array.isArray(contract.children)) {
        processedContract.children = preprocessContractData(contract.children);
      }
      return processedContract;
    });
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const contractsData = response.data || [];
        const processedData = preprocessContractData(contractsData);
        setContracts(processedData);
        setFilteredContracts(processedData);
      } else {
        message.error(response.data.message || '获取合同列表失败');
        setContracts([]);
        setFilteredContracts([]);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      message.error('获取合同列表失败');
      setContracts([]);
      setFilteredContracts([]);
      }
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    
    // 如果是编辑模式，直接关联到合同ID；如果是新增模式，使用临时ID
    const contractId = editingContract?.Id || 'temp';
    formData.append('contractId', contractId);
    
    try {
      setUploading(true);
      const response = await apiClient.post('/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('上传响应:', response);
      
      // 检查响应结构，兼容不同的API响应格式
      let newAttachment;
      if (response.data && response.data.success) {
        newAttachment = response.data.data;
      } else if (response.success) {
        newAttachment = response.data;
      } else {
        throw new Error(response.data?.message || response.message || '文件上传失败');
      }
      
      // 添加到附件列表
      setAttachments(prev => [...prev, newAttachment]);
      message.success('文件上传成功');
      
      // 如果是在编辑模式下上传附件，刷新合同列表以显示新附件
      if (editingContract?.Id) {
        fetchContracts();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.data?.message) {
        message.error(`文件上传失败: ${error.response.data.message}`);
      } else {
        message.error(error.message || '文件上传失败');
      }
    } finally {
      setUploading(false);
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      // 如果是临时附件（没有ID），直接从本地状态删除
      if (!attachmentId || attachmentId === 'temp') {
        setAttachments(prev => prev.filter(att => att.Id !== attachmentId));
        message.success('附件删除成功');
        return;
      }

      const response = await apiClient.delete(`/attachment/${attachmentId}`);
      
      // 检查响应结构，兼容不同的API响应格式
      if (response.data && response.data.success) {
        setAttachments(prev => prev.filter(att => att.Id !== attachmentId));
        message.success('附件删除成功');
      } else if (response.success) {
        setAttachments(prev => prev.filter(att => att.Id !== attachmentId));
        message.success('附件删除成功');
      } else {
        message.error(response.data?.message || response.message || '附件删除失败');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      message.error('附件删除失败');
    }
  };

  // 下载附件
  const handleDownloadAttachment = async (attachment) => {
    try {
      const attachmentId = attachment?.Id || attachment?.id;
      if (!attachmentId || attachmentId === 'temp') {
        message.error('临时附件无法下载，请先保存合同');
        return;
      }

      console.log('开始下载附件:', attachment);
      
      // 使用fetch API直接下载，避免304缓存问题
      const timestamp = new Date().getTime();
      const downloadUrl = `/attachment/${attachmentId}/download?t=${timestamp}`;
      const token = localStorage.getItem('token');
      
      console.log('下载URL:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      console.log('下载响应状态:', response.status);
      console.log('下载响应头:', response.headers);
      
      if (!response.ok) {
        if (response.status === 304) {
          // 304状态，尝试强制刷新下载
          console.log('304状态，尝试强制刷新下载');
          const forceUrl = `/attachment/${attachmentId}/download?t=${timestamp}&force=1`;
          window.open(forceUrl, '_blank');
          message.success('下载已开始，请检查下载文件夹');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 获取文件名
      const downloadName = attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name || 'attachment';
      
      // 获取文件内容
      const blob = await response.blob();
      console.log('文件Blob:', blob);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('下载开始');
      
    } catch (e) {
      console.error('Error downloading attachment:', e);
      
      if (e.message?.includes('304')) {
        message.error('文件未修改，请刷新后重试');
      } else if (e.message?.includes('401')) {
        message.error('权限不足，请重新登录');
      } else if (e.message?.includes('404')) {
        message.error('附件不存在或已被删除');
      } else {
        message.error('下载失败，请稍后重试');
      }
    }
  };

  // 文件上传配置
  const uploadProps = {
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB!');
        return false;
      }
      handleFileUpload(file);
      return false; // 阻止自动上传
    },
    showUploadList: false,
  };

  const handleCreate = () => {
    setEditingContract(null);
    setAttachments([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    console.log('编辑合同记录:', record);
    setEditingContract(record);
    setModalVisible(true);
    
    // 设置表单数据
    form.setFieldsValue({
      ...record,
      contractNumber: record.ContractNumber,
      title: record.Title,
      description: record.Description,
      contractDate: record.ContractDate ? dayjs(record.ContractDate) : undefined,
      startDate: record.StartDate ? dayjs(record.StartDate) : undefined,
      endDate: record.EndDate ? dayjs(record.EndDate) : undefined,
      status: record.Status,
      supplierId: record.SupplierId,
      parentContractId: record.ParentContractId,
    });
    
    // 获取合同附件
    if (record.Id) {
      console.log('准备获取合同附件，合同ID:', record.Id);
      fetchContractAttachments(record.Id);
    } else {
      console.log('没有合同ID，清空附件列表');
      setAttachments([]);
    }
  };

  // 获取合同附件
  const fetchContractAttachments = async (contractId) => {
    try {
      console.log('开始获取合同附件，合同ID:', contractId);
      const response = await apiClient.get(`/attachment/contract/${contractId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('附件API响应:', response);
      
      // 检查响应结构，兼容不同的API响应格式
      let attachmentsData = [];
      if (response.data && response.data.success) {
        console.log('使用 response.data.data 格式');
        attachmentsData = response.data.data || [];
      } else if (response.success) {
        console.log('使用 response.data 格式');
        attachmentsData = response.data || [];
      } else if (response.data) {
        console.log('使用 response.data 直接格式');
        attachmentsData = response.data || [];
      } else {
        console.log('响应格式不匹配，设置空数组');
        attachmentsData = [];
      }
      
      console.log('最终设置的附件列表:', attachmentsData);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachments([]);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个合同吗？',
      onOk: async () => {
        try {
          await apiClient.delete(`/contract/${id}`);
          message.success('删除成功');
          fetchContracts();
        } catch (error) {
          console.error('Error deleting contract:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      console.log('表单提交的数据:', values);
      console.log('编辑状态:', editingContract);
      
      const contractData = {
        ContractNumber: values.contractNumber,
        Title: values.title,
        Description: values.description,
        ContractDate: values.contractDate ? values.contractDate.format('YYYY-MM-DD') : null,
        StartDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        EndDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        Status: values.status,
        SupplierId: values.supplierId,
        ParentContractId: values.parentContractId,
      };

      console.log('准备发送的数据:', contractData);

      if (editingContract) {
        console.log('更新合同，ID:', editingContract.Id);
        const response = await apiClient.put(`/contract/${editingContract.Id}`, contractData);
        console.log('更新响应:', response);
        
        // 检查更新响应
        if (response.data && response.data.success) {
          message.success('更新成功');
        } else if (response.success) {
          message.success('更新成功');
        } else {
          throw new Error(response.data?.message || response.message || '更新合同失败');
        }
        
        // 刷新附件列表
        if (editingContract.Id) {
          fetchContractAttachments(editingContract.Id);
        }
      } else {
        console.log('创建新合同');
        const response = await apiClient.post('/contract', contractData);
        console.log('创建合同响应:', response);
        
        // 检查创建响应 - 兼容不同的API响应格式
        let contractId = null;
        if (response.data && response.data.success) {
          contractId = response.data.data.Id || response.data.data.id;
          console.log('新创建的合同ID (response.data.data):', contractId);
        } else if (response.success) {
          contractId = response.data.Id || response.data.id;
          console.log('新创建的合同ID (response.data):', contractId);
        } else if (response.data) {
          contractId = response.data.Id || response.data.id;
          console.log('新创建的合同ID (response.data):', contractId);
        }
        
        if (contractId) {
          console.log('新创建的合同ID:', contractId);
          
          // 如果有附件，更新附件的contractId
          if (attachments.length > 0) {
            console.log('开始关联附件到合同，附件数量:', attachments.length);
            try {
              await Promise.all(
                attachments.map(async (attachment) => {
                  const attachmentId = attachment.Id || attachment.id;
                  if (attachmentId && attachmentId !== 'temp') {
                    console.log('更新附件关联，附件ID:', attachmentId, '合同ID:', contractId);
                    await apiClient.put(`/attachment/${attachmentId}`, { contractId });
                  }
                })
              );
              console.log('附件关联完成');
            } catch (error) {
              console.error('附件关联失败:', error);
              message.warning('合同创建成功，但附件关联失败');
            }
          }
          message.success('创建成功');
        } else {
          throw new Error('创建合同失败：无法获取合同ID');
        }
      }
        
        // 如果是新建合同，清空附件列表；如果是编辑合同，刷新附件列表
        if (!editingContract) {
          setAttachments([]);
        } else if (editingContract.Id) {
          fetchContractAttachments(editingContract.Id);
        }
        
        setModalVisible(false);
        fetchContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
      let errorMessage = '保存失败';
      
      if (error.response) {
        console.error('错误响应:', error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = '请求参数错误';
        } else if (error.response.status === 401) {
          errorMessage = '权限不足，请重新登录';
        } else if (error.response.status === 500) {
          errorMessage = '服务器内部错误';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(`保存失败: ${errorMessage}`);
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      console.log('搜索参数:', values);
      
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.contractNumber) params.append('contractNumber', values.contractNumber);
      if (values.title) params.append('title', values.title);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.status) params.append('status', values.status);
      
      // 处理日期范围
      if (values.dateRange && values.dateRange.length === 2) {
        const startDate = values.dateRange[0].format('YYYY-MM-DD');
        const endDate = values.dateRange[1].format('YYYY-MM-DD');
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      console.log('查询URL:', `/contract/search?${params.toString()}`);
      const response = await apiClient.get(`/contract/search?${params.toString()}`);
      console.log('搜索响应:', response);
      
      // 兼容不同的API响应格式
      let searchResults = [];
      if (response.data && response.data.success) {
        searchResults = response.data.data || [];
      } else if (response.success) {
        searchResults = response.data || [];
      } else if (response.data) {
        searchResults = response.data || [];
      }
      
      console.log('搜索结果:', searchResults);
      setFilteredContracts(searchResults);
      
      if (searchResults.length === 0) {
        message.info('未找到匹配的合同');
      } else {
        message.success(`找到 ${searchResults.length} 个合同`);
      }
    } catch (error) {
      console.error('Error searching contracts:', error);
      message.error('查询失败，请检查网络连接');
      setFilteredContracts([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重置时重新获取所有数据
    await fetchContracts();
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'ContractNumber',
      key: 'ContractNumber',
    },
    {
      title: '合同标题',
      dataIndex: 'Title',
      key: 'Title',
    },
    {
      title: '合同描述',
      dataIndex: 'Description',
      key: 'Description',
      render: (value) => value || '无描述',
    },
    {
      title: '供应商',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
    },
    {
      title: '合同日期',
      dataIndex: 'ContractDate',
      key: 'ContractDate',
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '未设置',
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      render: (value) => (
        <Tag color={value === 'active' ? 'green' : 'default'}>
          {value || 'active'}
        </Tag>
      ),
    },
    {
      title: '附件',
      key: 'attachments',
      render: (_, record) => {
        const attachmentCount = record.AttachmentCount ?? (record.attachments ? record.attachments.length : 0) ?? 0;
        return attachmentCount > 0 ? (
          <Tag color="blue">{attachmentCount} 个</Tag>
        ) : (
          <Tag color="default">无</Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.Id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];



  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{contractTableStyles}</style>

        <Card
          title="合同管理"
          extra={
            <Button type="primary" onClick={handleCreate}>
              新增合同
            </Button>
          }
        >
          {/* 查询表单 */}
          <Card size="small" style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}>
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
                  <Form.Item name="contractNumber" label="合同编号">
                    <Input placeholder="请输入合同编号" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="title" label="合同标题">
                    <Input placeholder="请输入合同标题" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="supplierId" label="供应商">
                    <Select placeholder="请选择供应商" allowClear>
                      {suppliers.map(supplier => (
                        <Option key={supplier.Id} value={supplier.Id}>
                          {supplier.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="status" label="状态">
                    <Select placeholder="请选择状态" allowClear>
                      <Option value="draft">草稿</Option>
                      <Option value="active">生效</Option>
                      <Option value="completed">已完成</Option>
                      <Option value="terminated">已终止</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="dateRange" label="签订日期">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        查询
                      </Button>
                      <Button onClick={handleReset}>
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredContracts}
            rowKey="Id"
            loading={loading}
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
            className="contract-table"
            scroll={{ x: 1500 }}
          />
        </Card>

        <Modal
          title={editingContract ? '编辑合同' : '新增合同'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="contractNumber"
                  label="合同编号"
                  rules={[{ required: true, message: '请输入合同编号' }]}
                >
                  <Input placeholder="请输入合同编号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="合同标题"
                  rules={[{ required: true, message: '请输入合同标题' }]}
                >
                  <Input placeholder="请输入合同标题" />
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
                  <Select placeholder="请选择供应商">
                    {suppliers.map(supplier => (
                      <Option key={supplier.Id} value={supplier.Id}>
                        {supplier.Name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select placeholder="请选择状态">
                    <Option value="draft">草稿</Option>
                    <Option value="active">生效</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="terminated">已终止</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="contractDate"
                  label="签订日期"
                  rules={[{ required: true, message: '请选择签订日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="开始日期"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="结束日期"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="parentContractId"
                  label="父合同"
                >
                  <Select placeholder="请选择父合同" allowClear>
                    {contracts.map(contract => (
                      <Option key={contract.Id} value={contract.Id}>
                        {contract.ContractNumber} - {contract.Title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="合同描述"
            >
              <Input.TextArea rows={3} placeholder="请输入合同描述" />
            </Form.Item>

            {/* 附件上传区域 */}
            <Form.Item label="附件上传">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  上传附件
                </Button>
              </Upload>
              {attachments.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4>已上传的附件：</h4>
                  <List
                    size="small"
                    dataSource={attachments}
                    renderItem={(attachment) => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            下载
                          </Button>,
                          <Popconfirm
                            title="确定要删除这个附件吗？"
                            onConfirm={() => handleDeleteAttachment(attachment.Id)}
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
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                          title={attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name}
                          description={`大小：${((attachment.FileSize || attachment.fileSize || attachment.size || 0) / 1024).toFixed(2)} KB | 上传时间：${dayjs(attachment.CreatedAt || attachment.uploadTime || attachment.createdAt).format('YYYY-MM-DD HH:mm:ss')}`}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingContract ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ResizeObserverFix>
  );
};

export default Contracts;
