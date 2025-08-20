import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Card,
  message,
  Tag,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, BankOutlined, DollarOutlined, CreditCardOutlined, WalletOutlined } from '@ant-design/icons';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

// 币种符号映射 - 从币种表获取
const getCurrencySymbol = (currencyCode, currencies) => {
  if (!currencies || currencies.length === 0) {
    return currencyCode;
  }
  
  const currency = currencies.find(c => c.Code === currencyCode);
  return currency ? currency.Symbol || currencyCode : currencyCode;
};

// 树结构样式
const treeTableStyles = {
  '.parent-account': {
    backgroundColor: '#f0f8ff',
    fontWeight: 'bold'
  },
  '.child-balance': {
    backgroundColor: '#fafafa',
    paddingLeft: '20px'
  }
};

// 余额记录子表样式
const balanceTableStyles = `
  .balance-sub-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .balance-sub-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .balance-table-row:hover > td {
    background-color: #f6ffed !important;
  }
  
  .balance-sub-table .ant-table-thead > tr > th:first-child {
    border-top-left-radius: 6px;
  }
  
  .balance-sub-table .ant-table-thead > tr > th:last-child {
    border-top-right-radius: 6px;
  }
  
  /* 隐藏自动生成的子记录行 */
  .ant-table-tbody .ant-table-row-level-1 {
    display: none !important;
  }
  
  /* 隐藏展开行中的子记录行 */
  .ant-table-expanded-row .ant-table-row-level-1 {
    display: none !important;
  }
`;

const BankAccounts = () => {
  // 添加样式
  const bankAccountTableStyles = `
    .bank-account-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .bank-account-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .bank-account-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .bank-account-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .bank-account-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .bank-account-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .bank-account-table .ant-table-pagination .ant-pagination-item-active a {
      color: white !important;
    }
    
    .parent-account {
      background-color: #f0f8ff !important;
      font-weight: bold !important;
    }
    
    .child-balance {
      background-color: #fafafa !important;
      padding-left: 20px !important;
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
    .search-form .ant-input {
      width: 100% !important;
    }
  `;

  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingBalance, setEditingBalance] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();
  const [balanceForm] = Form.useForm();

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

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/bank-accounts');
      if (result.success) {
        const accountsData = result.data || [];
        console.log('获取到的银行账户数据:', accountsData);
        setAccounts(accountsData);
        setFilteredAccounts(accountsData);
      } else {
        message.error(result.message || '获取银行账户列表失败');
        setAccounts([]);
        setFilteredAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      message.error('获取银行账户列表失败');
      setAccounts([]);
      setFilteredAccounts([]);
    }
    setLoading(false);
  };

  const fetchBanks = async () => {
    try {
      const result = await apiClient.get('/banks');
      if (result.success) {
        setBanks(result.data || []);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks([]);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const result = await apiClient.get('/currencies');
      if (result.success) {
        setCurrencies(result.data || []);
      } else {
        setCurrencies([]);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setCurrencies([]);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAccount(record);
    // 字段名称映射：从数据库字段名映射到表单字段名
    const formData = {
      bankId: record.BankId,
      accountNumber: record.AccountNumber,
      accountName: record.AccountName,
      accountType: record.AccountType,
      currencyCode: record.CurrencyCode,
      initialBalance: record.InitialBalance,
      notes: record.Notes
    };
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个银行账户吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const result = await apiClient.delete(`/bank-accounts/${id}`);
          if (result.success) {
            message.success('删除成功');
            fetchAccounts();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('Error deleting account:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAccount) {
        const result = await apiClient.put(`/bank-accounts/${editingAccount.Id}`, values);
        if (result.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchAccounts();
        } else {
          message.error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/bank-accounts', values);
        if (result.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchAccounts();
        } else {
          message.error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      message.error('保存失败');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.accountNumber) params.append('accountNumber', values.accountNumber);
      if (values.accountName) params.append('accountName', values.accountName);
      if (values.bankId) params.append('bankId', values.bankId);
      if (values.accountType) params.append('accountType', values.accountType);
      if (values.currencyCode) params.append('currency', values.currencyCode);
      if (values.isActive !== undefined) params.append('isActive', values.isActive);
      
      const result = await apiClient.get(`/bank-accounts/search?${params.toString()}`);
      if (result.success) {
        setFilteredAccounts(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredAccounts([]);
      }
    } catch (error) {
      console.error('Error searching accounts:', error);
      message.error('查询失败');
      setFilteredAccounts([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重置时重新获取所有数据
    await fetchAccounts();
  };

  const getAccountTypeText = (type) => {
    const typeMap = {
      'Checking': '活期账户',
      'Savings': '储蓄账户',
      'Investment': '投资账户',
      'Other': '其他账户'
    };
    return typeMap[type] || type;
  };

  const getAccountTypeColor = (type) => {
    const colorMap = {
      'Checking': 'blue',
      'Savings': 'green',
      'Investment': 'orange',
      'Other': 'default'
    };
    return colorMap[type] || 'default';
  };

  // 添加余额记录
  const handleAddBalance = (account) => {
    setEditingBalance(null);
    balanceForm.resetFields();
    balanceForm.setFieldsValue({
      bankAccountId: account.Id,
      balance: '',
      balanceStatus: 'Available',
      notes: ''
    });
    // 保存当前账户信息，用于显示币种符号
    setCurrentAccount(account);
    setBalanceModalVisible(true);
  };

  // 编辑余额记录
  const handleEditBalance = (balance) => {
    setEditingBalance(balance);
    balanceForm.setFieldsValue({
      bankAccountId: balance.BankAccountId,
      balance: balance.Balance,
      balanceStatus: balance.BalanceStatus,
      notes: balance.Notes || ''
    });
    // 获取账户信息，用于显示币种符号
    const account = accounts.find(acc => acc.Id === balance.BankAccountId);
    if (account) {
      setCurrentAccount(account);
    }
    setBalanceModalVisible(true);
  };

  // 删除余额记录
  const handleDeleteBalance = async (balanceId) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个余额记录吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const result = await apiClient.delete(`/bank-account-balances/${balanceId}`);
          if (result.success) {
            message.success('删除成功');
            fetchAccounts();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('Error deleting balance:', error);
          message.error('删除失败');
        }
      },
    });
  };

  // 提交余额表单
  const handleBalanceSubmit = async (values) => {
    try {
      if (editingBalance) {
        const result = await apiClient.put(`/bank-account-balances/${editingBalance.Id}`, values);
               if (result.success) {
         message.success('更新成功');
         setBalanceModalVisible(false);
         setCurrentAccount(null);
         fetchAccounts();
       } else {
         message.error(result.message || '更新失败');
       }
             } else {
         const result = await apiClient.post('/bank-account-balances', values);
         if (result.success) {
           message.success('创建成功');
           setBalanceModalVisible(false);
           setCurrentAccount(null);
           fetchAccounts();
         } else {
           message.error(result.message || '创建失败');
         }
       }
    } catch (error) {
      console.error('Error saving balance:', error);
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '银行名称',
      dataIndex: 'BankName',
      key: 'account-bank-name',
      width: 150,
      render: (value, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.children && record.children.length > 0 && (
            <span style={{ 
              marginRight: '8px', 
              color: '#1890ff', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              🏦
            </span>
          )}
          <span style={{ 
            fontWeight: 'bold',
            color: record.children && record.children.length > 0 ? '#1890ff' : '#333'
          }}>
            {value}
          </span>
        </div>
      ),
    },
    {
      title: '账户号码',
      dataIndex: 'AccountNumber',
      key: 'account-number',
      width: 180,
      render: (value, record) => (
        <span style={{ 
          fontWeight: record.children && record.children.length > 0 ? 'bold' : 'normal',
          color: record.children && record.children.length > 0 ? '#1890ff' : '#333',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          {value}
        </span>
      ),
    },
    {
      title: '账户名称',
      dataIndex: 'AccountName',
      key: 'account-name',
      width: 150,
    },
    {
      title: '账户类型',
      dataIndex: 'AccountType',
      key: 'account-type',
      width: 120,
      render: (value) => (
        <Tag color={getAccountTypeColor(value)}>
          {getAccountTypeText(value)}
        </Tag>
      )
    },
    {
      title: '币种',
      dataIndex: 'CurrencyCode',
      key: 'account-currency',
      width: 80,
      align: 'center',
      render: (value) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {value}
        </Tag>
      ),
    },
    {
      title: '当前余额',
      key: 'current-balance',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const currentBalance = record.CurrentBalance || 0;
        const latestBalance = record.latestBalance || currentBalance;
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: latestBalance > 0 ? '#52c41a' : latestBalance < 0 ? '#ff4d4f' : '#666'
            }}>
              {latestBalance.toLocaleString('zh-CN', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })} {getCurrencySymbol(record.CurrencyCode, currencies)}
            </div>
            {record.children && record.children.length > 0 && (
              <div style={{ 
                fontSize: '11px', 
                color: '#999',
                marginTop: '2px'
              }}>
                {record.balanceCount} 条记录
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '最后更新',
      key: 'last-updated',
      width: 150,
      render: (_, record) => {
        const lastUpdate = record.latestBalanceDate || record.UpdatedAt || record.CreatedAt;
        return (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {lastUpdate ? new Date(lastUpdate).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) : '-'}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'account-status',
      width: 80,
      align: 'center',
      render: (value) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'account-actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        // 如果是余额记录（子节点），不显示操作按钮
        if (record.BankAccountId) {
          return null;
        }
        
        // 如果是银行账户（父节点），显示账户操作
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ padding: '4px 8px' }}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddBalance(record)}
              style={{ padding: '4px 8px' }}
            >
              添加金额
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.Id)}
              style={{ padding: '4px 8px' }}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  const renderExpandedRow = (record) => {
    if (record.children && record.children.length > 0) {
      const balanceColumns = [
        {
          title: '账户金额',
          dataIndex: 'Balance',
          key: 'balance-amount',
          width: 130,
          align: 'right',
          render: (value, balanceRecord) => {
            // 获取对应的账户信息以显示币种符号
            const account = accounts.find(acc => acc.Id === balanceRecord.BankAccountId);
            const currencySymbol = account ? getCurrencySymbol(account.CurrencyCode, currencies) : '';
            
            return (
              <span style={{ 
                fontWeight: 'bold', 
                color: value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#666',
                fontSize: '14px'
              }}>
                {value ? value.toLocaleString('zh-CN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                }) : '0.00'} {currencySymbol}
              </span>
            );
          },
        },
        {
          title: '金额状态',
          dataIndex: 'BalanceStatus',
          key: 'balance-status',
          width: 100,
          align: 'center',
          render: (value) => {
            const statusMap = {
              'Available': { text: '可用', color: 'green' },
              'Unavailable': { text: '不可用', color: 'red' },
              'Pending': { text: '待确认', color: 'orange' },
              'Frozen': { text: '冻结', color: 'blue' }
            };
            const status = statusMap[value] || { text: value, color: 'default' };
            return <Tag color={status.color}>{status.text}</Tag>;
          },
        },
        {
          title: '备注',
          dataIndex: 'Notes',
          key: 'balance-notes',
          width: 180,
          render: (value) => (
            <span style={{ 
              color: value ? '#333' : '#999',
              fontStyle: value ? 'normal' : 'italic'
            }}>
              {value || '暂无备注'}
            </span>
          ),
        },
        {
          title: '创建时间',
          dataIndex: 'CreatedAt',
          key: 'balance-created',
          width: 140,
          render: (value) => (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {new Date(value).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          ),
        },
        {
          title: '更新时间',
          dataIndex: 'UpdatedAt',
          key: 'balance-updated',
          width: 140,
          render: (value) => (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {value ? new Date(value).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </span>
          ),
        },
        {
          title: '操作',
          key: 'balance-actions',
          width: 200,
          align: 'center',
          fixed: 'right',
          render: (_, balanceRecord) => (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditBalance(balanceRecord)}
                style={{ padding: '4px 8px' }}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  Modal.info({
                    title: '余额记录详情',
                    width: 600,
                    content: (
                      <div style={{ padding: '16px' }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <div style={{ marginBottom: '12px' }}>
                              <strong>账户金额：</strong>
                              <span style={{ 
                                color: balanceRecord.Balance > 0 ? '#52c41a' : '#ff4d4f',
                                fontWeight: 'bold',
                                fontSize: '16px'
                              }}>
                                                                 {balanceRecord.Balance?.toLocaleString('zh-CN', { 
                                   minimumFractionDigits: 2,
                                   maximumFractionDigits: 2 
                                 })} {getCurrencySymbol(record.CurrencyCode, currencies)}
                              </span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <strong>金额状态：</strong>
                              <Tag color={
                                balanceRecord.BalanceStatus === 'Available' ? 'green' :
                                balanceRecord.BalanceStatus === 'Unavailable' ? 'red' :
                                balanceRecord.BalanceStatus === 'Pending' ? 'orange' : 'blue'
                              }>
                                {balanceRecord.BalanceStatus === 'Available' ? '可用' :
                                 balanceRecord.BalanceStatus === 'Unavailable' ? '不可用' :
                                 balanceRecord.BalanceStatus === 'Pending' ? '待确认' : '冻结'}
                              </Tag>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ marginBottom: '12px' }}>
                              <strong>创建时间：</strong>
                              <div>{new Date(balanceRecord.CreatedAt).toLocaleString('zh-CN')}</div>
                            </div>
                            {balanceRecord.UpdatedAt && (
                              <div style={{ marginBottom: '12px' }}>
                                <strong>更新时间：</strong>
                                <div>{new Date(balanceRecord.UpdatedAt).toLocaleString('zh-CN')}</div>
                              </div>
                            )}
                          </Col>
                        </Row>
                        {balanceRecord.Notes && (
                          <div style={{ marginTop: '16px' }}>
                            <strong>备注信息：</strong>
                            <div style={{ 
                              marginTop: '8px',
                              padding: '12px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              border: '1px solid #d9d9d9'
                            }}>
                              {balanceRecord.Notes}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                    okText: '关闭'
                  });
                }}
                style={{ padding: '4px 8px' }}
              >
                详情
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteBalance(balanceRecord.Id)}
                style={{ padding: '4px 8px' }}
              >
                删除
              </Button>
            </Space>
          ),
        },
      ];

      return (
        <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
          {/* 标题和操作按钮 */}
          <div style={{ 
            marginBottom: '12px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 账户金额记录列表
              <span style={{ 
                fontSize: '12px', 
                color: '#666', 
                fontWeight: 'normal' 
              }}>
                (共 {record.children.length} 条记录)
              </span>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddBalance(record)}
            >
              添加金额记录
            </Button>
          </div>

          {/* 余额记录表格 */}
          {record.children.length > 0 ? (
            <Table
              columns={balanceColumns}
              dataSource={record.children}
              rowKey={(balanceRecord) => `balance-${balanceRecord.Id}`}
              size="small"
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              bordered
              style={{ backgroundColor: 'white' }}
              rowClassName="balance-table-row"
              className="balance-sub-table"
              scroll={{ x: 900 }}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              color: '#666'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无账户金额记录</div>
              <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                点击"添加金额记录"按钮创建第一条账户金额记录
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddBalance(record)}
              >
                添加金额记录
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResizeObserverFix>
      <div>
        {/* 添加样式 */}
        <style>{balanceTableStyles}</style>

        <Card
          title="银行账户管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增银行账户
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
                  <Form.Item name="accountNumber" label="账户号码">
                    <Input placeholder="请输入账户号码" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="accountName" label="账户名称">
                    <Input placeholder="请输入账户名称" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="bankId" label="所属银行">
                    <Select placeholder="请选择银行" allowClear>
                      {banks.map(bank => (
                        <Option key={bank.Id} value={bank.Id}>
                          {bank.BankName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="accountType" label="账户类型">
                    <Select placeholder="请选择账户类型" allowClear>
                      <Option value="Checking">活期账户</Option>
                      <Option value="Savings">储蓄账户</Option>
                      <Option value="Investment">投资账户</Option>
                      <Option value="Other">其他账户</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="currencyCode" label="币种">
                    <Select placeholder="请选择币种" allowClear showSearch optionFilterProp="children">
                      {currencies.map(currency => (
                        <Option key={currency.Code} value={currency.Code}>
                          {currency.Symbol} {currency.Name}
                        </Option>
                      ))}
                    </Select>
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

          <Table
            columns={columns}
            dataSource={filteredAccounts}
            rowKey="Id"
            loading={loading}
            expandable={{
              expandedRowRender: (record) => renderExpandedRow(record),
              rowExpandable: (record) => record.children && record.children.length > 0,
            }}
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
            className="bank-account-table"
            scroll={{ x: 1500 }}
          />
        </Card>

        <Modal
          title={editingAccount ? '编辑银行账户' : '新增银行账户'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="bankId"
                  label="所属银行"
                  rules={[{ required: true, message: '请选择所属银行' }]}
                >
                  <Select placeholder="请选择银行">
                    {banks.map(bank => (
                      <Option key={bank.Id} value={bank.Id}>
                        {bank.BankName} ({bank.BankCode})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="accountNumber"
                  label="账户号码"
                  rules={[{ required: true, message: '请输入账户号码' }]}
                >
                  <Input placeholder="如：6222021234567890123" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="accountName"
                  label="账户名称"
                  rules={[{ required: true, message: '请输入账户名称' }]}
                >
                  <Input placeholder="如：公司基本账户" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="accountType"
                  label="账户类型"
                  rules={[{ required: true, message: '请选择账户类型' }]}
                >
                  <Select placeholder="请选择账户类型">
                    <Option value="Checking">活期账户</Option>
                    <Option value="Savings">储蓄账户</Option>
                    <Option value="Investment">投资账户</Option>
                    <Option value="Other">其他账户</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="currencyCode"
                  label="账户币种"
                  rules={[{ required: true, message: '请选择账户币种' }]}
                >
                  <Select placeholder="请选择币种" showSearch optionFilterProp="children">
                    {currencies.map(currency => (
                      <Option key={currency.Code} value={currency.Code}>
                        {currency.Symbol} {currency.Name} ({currency.Code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="initialBalance"
                  label="初始余额"
                  rules={[
                    { required: true, message: '请输入初始余额' },
                    { type: 'number', min: 0, message: '初始余额不能为负数' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    precision={2}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="备注"
            >
              <TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingAccount ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 余额管理模态框 */}
                 <Modal
           title={editingBalance ? '编辑账户金额记录' : '新增账户金额记录'}
           open={balanceModalVisible}
           onCancel={() => {
             setBalanceModalVisible(false);
             setCurrentAccount(null);
           }}
           footer={null}
           width={600}
           destroyOnClose
         >
          <Form
            form={balanceForm}
            layout="vertical"
            onFinish={handleBalanceSubmit}
            initialValues={{
              balanceStatus: 'Available',
              notes: ''
            }}
          >
            <Form.Item
              name="bankAccountId"
              hidden
            >
              <Input />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="balance"
                  label="账户金额"
                  rules={[
                    { required: true, message: '请输入账户金额' },
                    { 
                      validator: (_, value) => {
                        if (value && isNaN(parseFloat(value))) {
                          return Promise.reject(new Error('请输入有效的数字'));
                        }
                        if (value && parseFloat(value) < 0) {
                          return Promise.reject(new Error('金额不能为负数'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                                     <Input 
                     type="number" 
                     step="0.01" 
                     placeholder="请输入账户金额" 
                     addonAfter={currentAccount ? getCurrencySymbol(currentAccount.CurrencyCode, currencies) : '元'}
                     style={{ textAlign: 'right' }}
                   />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="balanceStatus"
                  label="金额状态"
                  rules={[{ required: true, message: '请选择金额状态' }]}
                >
                  <Select placeholder="请选择金额状态">
                    <Option value="Available">可用</Option>
                    <Option value="Unavailable">不可用</Option>
                    <Option value="Pending">待确认</Option>
                    <Option value="Frozen">冻结</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="备注信息"
              rules={[
                { max: 500, message: '备注信息不能超过500个字符' }
              ]}
            >
              <TextArea 
                rows={4} 
                placeholder="请输入备注信息，如：工资发放、项目收款等" 
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setBalanceModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingBalance ? '更新' : '创建'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ResizeObserverFix>
  );
};

export default BankAccounts;
