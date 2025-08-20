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
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  message,
  List,
  Avatar,
  Divider,
  Descriptions,
  TreeSelect
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';
import SafeTable from '../components/SafeTable';

const { Option } = Select;

const PaymentRecords = () => {
  // 添加样式
  const paymentRecordTableStyles = `
    .payment-record-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .payment-record-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .payment-record-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .payment-record-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .payment-record-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .payment-record-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .payment-record-table .ant-table-pagination .ant-pagination-item-active a {
      color: white !important;
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

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [payables, setPayables] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [contractTreeData, setContractTreeData] = useState([]);
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchPaymentRecords();
    fetchPayables();
    fetchCurrencies();
    fetchSuppliers();
    fetchContracts();
  }, []);

  const fetchPaymentRecords = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment-records');
      if (response.success) {
        setPaymentRecords(response.data || []);
        setFilteredRecords(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
      setPaymentRecords([]);
      setFilteredRecords([]);
    }
    setLoading(false);
  };

  const fetchPayables = async () => {
    try {
      const response = await apiClient.get('/payment');
      if (response.success) {
        setPayables(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await apiClient.get('/payment/currencies/list');
      if (response.success) {
        setCurrencies(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
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
        const convertToTreeSelectFormat = (list) =>
          list.map(c => ({
            title: `${c.ContractNumber} - ${c.Title || '无标题'}`,
            value: c.Id,
            key: c.Id,
            children: c.children ? convertToTreeSelectFormat(c.children) : []
          }));
        setContractTreeData(convertToTreeSelectFormat(contractsData));
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  // 查看付款记录详情（从后端获取完整信息和附件）
  const handleView = async (record) => {
    try {
      const id = record.Id || record.id;
      if (!id) {
        setViewingRecord(record);
        setViewModalVisible(true);
        return;
      }
      const response = await apiClient.get(`/payment-records/detail/${id}`);
      if (response.success) {
        setViewingRecord(response.data || record);
      } else {
        setViewingRecord(record);
      }
    } catch (e) {
      console.warn('获取付款记录详情失败，使用现有数据');
      setViewingRecord(record);
    }
    setViewModalVisible(true);
  };

  // 下载附件
  const handleDownloadAttachment = async (attachment) => {
    try {
      const attachmentId = attachment?.Id || attachment?.id;
      if (!attachmentId) {
        message.error('无法识别附件ID');
        return;
      }
      const response = await apiClient.get(`/attachment/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const downloadName = attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name || 'attachment';
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('下载失败');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.paymentNumber) params.append('paymentNumber', values.paymentNumber);
      if (values.payableManagementId) params.append('payableManagementId', values.payableManagementId);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.contractId) params.append('contractId', values.contractId);
      if (values.paymentDateRange && values.paymentDateRange.length === 2) {
        params.append('startDate', values.paymentDateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.paymentDateRange[1].format('YYYY-MM-DD'));
      }
      
      const response = await apiClient.get(`/payment-records?${params.toString()}`);
      if (response.success) {
        setFilteredRecords(response.data || []);
      } else {
        message.error(response.message || '查询失败');
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error searching payment records:', error);
      message.error('查询失败');
      setFilteredRecords([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    await fetchPaymentRecords();
  };

  // 汇率换算（USD为基准）
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
    return rate > 0 ? numeric / rate : numeric;
  };

  const columns = [
    {
      title: '付款编号',
      dataIndex: 'PaymentNumber',
      key: 'PaymentNumber',
      width: 150,
      render: (value, record) => (
        <Button 
          type="link" 
          onClick={() => handleView(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {value || record.paymentNumber || '-'}
        </Button>
      ),
    },
    {
      title: '应付管理编号',
      dataIndex: 'payableManagementId',
      key: 'payableManagementId',
      width: 150,
      render: (value) => {
        const payable = payables.find(p => (p.Id === value || p.id === value));
        return payable ? (payable.PayableNumber || payable.payableNumber) : value;
      }
    },
    {
      title: '合同编号',
      dataIndex: 'ContractNumber',
      key: 'ContractNumber',
      width: 160,
      render: (value, record) => value || record.contractNumber || '-'
    },
    {
      title: '供应商',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
      width: 160,
      render: (value, record) => value || record.supplierName || '-'
    },
    {
      title: '付款说明',
      key: 'paymentDescription',
      width: 240,
      ellipsis: true,
      render: (_, record) => record.PaymentDescription || record.paymentDescription || '-',
    },
    {
      title: '付款金额',
      key: 'paymentAmount',
      width: 140,
      render: (_, record) => {
        const amount = Number(record.PaymentAmount ?? record.paymentAmount ?? 0);
        const code = record.CurrencyCode || record.currencyCode;
        const symbol = record.CurrencySymbol || record.currencySymbol || (currencies.find(c => c.Code === code)?.Symbol) || '';
        return <span>{symbol}{amount.toLocaleString()}</span>;
      },
    },
    {
      title: '金额(USD)',
      key: 'AmountUSD',
      width: 120,
      render: (_, record) => {
        const usd = convertToUSD(record.PaymentAmount || record.paymentAmount, record.CurrencyCode || record.currencyCode);
        return <span>${usd.toFixed(2)}</span>;
      },
    },
    // 移除币种列
    {
      title: '付款日期',
      key: 'paymentDate',
      width: 140,
      render: (_, record) => dayjs(record.PaymentDate || record.paymentDate).format('YYYY-MM-DD'),
    },
    {
      title: '备注',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.Notes || record.notes || '-',
    },
    {
      title: '附件数量',
      key: 'attachments',
      width: 100,
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{paymentRecordTableStyles}</style>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="总付款记录数"
                value={paymentRecords.length}
                valueStyle={{ color: '#3f8600' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="本月付款"
                value={paymentRecords.filter(record => {
                  const recordDate = new Date(record.paymentDate);
                  const now = new Date();
                  return recordDate.getMonth() === now.getMonth() && 
                         recordDate.getFullYear() === now.getFullYear();
                }).length}
                valueStyle={{ color: '#1890ff' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="总付款金额(USD)"
                value={paymentRecords.reduce((sum, r) => sum + convertToUSD(r.PaymentAmount || r.paymentAmount, r.CurrencyCode || r.currencyCode), 0).toFixed(2)}
                valueStyle={{ color: '#722ed1' }}
                prefix="$"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="涉及应付数"
                value={new Set(paymentRecords.map(record => record.payableManagementId)).size}
                valueStyle={{ color: '#fa8c16' }}
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        <Card title="付款记录查询">
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
                  <Form.Item name="paymentNumber" label="付款编号">
                    <Input placeholder="请输入付款编号" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="payableManagementId" label="应付管理">
                    <Select 
                      placeholder="请选择应付管理" 
                      allowClear 
                      showSearch 
                      optionFilterProp="children"
                      filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    >
                      {payables.map(payable => (
                        <Option key={payable.Id} value={payable.Id}>
                          {payable.PayableNumber || payable.payableNumber}
                        </Option>
                      ))}
                    </Select>
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
                        <Option key={s.Id} value={s.Id}>{s.Name || '未知供应商'}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={7}>
                  <Form.Item name="contractId" label="合同">
                    <TreeSelect
                      placeholder="请选择合同（支持搜索编号/名称）"
                      treeData={contractTreeData}
                      showSearch
                      treeNodeFilterProp="title"
                      filterTreeNode={(inputValue, treeNode) => treeNode.title.toLowerCase().includes(inputValue.toLowerCase())}
                      allowClear
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 320 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="paymentDateRange" label="付款日期">
                    <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} style={{ width: '100%' }} />
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
            dataSource={filteredRecords}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
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
            className="payment-record-table"
          />
        </Card>

        {/* 查看详情模态框 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EyeOutlined style={{ color: '#1890ff' }} />
              付款记录详情
            </div>
          }
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={1200}
          destroyOnClose
        >
          {viewingRecord && (
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
                            {viewingRecord.PaymentNumber || viewingRecord.paymentNumber || '-'}
                          </span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>币种：</strong>
                          <Tag color="blue" style={{ fontWeight: 'bold' }}>
                            {viewingRecord.CurrencyCode || viewingRecord.currencyCode || '-'}
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
                            {viewingRecord.PaymentDescription || viewingRecord.paymentDescription || '-'}
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
                            {(viewingRecord.CurrencySymbol || '')}
                            {(viewingRecord.PaymentAmount || viewingRecord.paymentAmount || 0).toLocaleString('zh-CN', {
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
                              viewingRecord.PaymentAmount || viewingRecord.paymentAmount, 
                              viewingRecord.CurrencyCode || viewingRecord.currencyCode
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
                            {dayjs(viewingRecord.PaymentDate || viewingRecord.paymentDate).format('YYYY年MM月DD日')}
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
                      {viewingRecord.Notes || viewingRecord.notes ? (
                        <span style={{ color: '#333', lineHeight: '1.6' }}>
                          {viewingRecord.Notes || viewingRecord.notes}
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
                            {dayjs(viewingRecord.CreatedAt || viewingRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        </div>
                      </Col>
                      {viewingRecord.UpdatedAt && (
                        <Col span={24}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#666' }}>更新时间：</strong>
                            <div style={{ marginTop: '4px', color: '#333' }}>
                              {dayjs(viewingRecord.UpdatedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="附件信息">
                    {viewingRecord.attachments && viewingRecord.attachments.length > 0 ? (
                      <div>
                        <div style={{ 
                          marginBottom: '8px', 
                          color: '#52c41a',
                          fontWeight: 'bold'
                        }}>
                          共 {viewingRecord.attachments.length} 个附件
                        </div>
                        <List
                          size="small"
                          dataSource={viewingRecord.attachments}
                          renderItem={(att) => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small" 
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleDownloadAttachment(att)}
                                >
                                  下载
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<FileTextOutlined style={{ color: '#1890ff' }} />}
                                title={
                                  <span style={{ fontSize: '13px' }}>
                                    {att.OriginalFileName || att.originalFileName || att.FileName || att.name || '未知文件'}
                                  </span>
                                }
                                description={
                                  <span style={{ fontSize: '12px', color: '#666' }}>
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
                        padding: '20px',
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
          )}
        </Modal>
      </div>
    </ResizeObserverFix>
  );
};

export default PaymentRecords;
