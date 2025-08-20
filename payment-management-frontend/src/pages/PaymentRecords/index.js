import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Form,
  message
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../utils/api';
import ResizeObserverFix from '../../components/ResizeObserverFix';
import SafeTable from '../../components/SafeTable';
import SearchForm from './SearchForm';
import PaymentRecordDetailModal from './PaymentRecordDetailModal';
import { paymentRecordTableStyles } from './styles';

const PaymentRecords = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [payables, setPayables] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
        <button
          type="button"
          onClick={() => handleView(record)}
          style={{ padding: 0, background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
        >
          {value || record.paymentNumber || '-'}
        </button>
      ),
    },
    {
      title: '应付编号',
      dataIndex: 'payableManagementId',
      key: 'payableManagementId',
      width: 150,
      render: (value, record) => {
        if (record.PayableNumber) return record.PayableNumber;
        const payable = payables.find(p => (p.Id === value || p.id === value));
        return payable?.PayableNumber || payable?.payableNumber || '-';
      }
    },
    {
      title: '应付说明',
      dataIndex: 'Description',
      key: 'Description',
      width: 240,
      render: (value, record) => {
        if (record.Description) return record.Description;
        const payable = payables.find(p => (p.Id === record.payableManagementId || p.id === record.payableManagementId));
        return payable?.Description || payable?.description || '-';
      }
    },
    {
      title: '合同编号',
      dataIndex: 'ContractNumber',
      key: 'ContractNumber',
      width: 220,
      render: (value, record) => {
        const number = record.ContractNumber || value || record.contractNumber || '';
        const title = record.ContractTitle || record.Title || '';
        if (number && title) return `${number} - ${title}`;
        return number || title || '-';
      }
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
          <span style={{ color: '#1890ff' }}>{attachmentCount} 个</span>
        ) : (
          <span style={{ color: '#999' }}>无</span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <button
          type="button"
          onClick={() => handleView(record)}
          style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <EyeOutlined /> 查看
        </button>
      ),
    },
  ];

  return (
    <ResizeObserverFix>
      <div>
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
                  const recordDate = new Date(record.PaymentDate || record.paymentDate);
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
          <Card size="small" style={{ marginBottom: 16 }}>
            <SearchForm
              form={searchForm}
              onSearch={handleSearch}
              onReset={handleReset}
              payables={payables}
              suppliers={suppliers}
              contractTreeData={contractTreeData}
              loading={loading}
            />
          </Card>

          <SafeTable
            columns={columns}
            dataSource={filteredRecords}
            rowKey={(r) => r.Id || r.id}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              position: ['bottomCenter'],
              size: 'default'
            }}
            locale={{ emptyText: '暂无数据' }}
            size="middle"
            bordered={false}
            className="payment-record-table"
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


