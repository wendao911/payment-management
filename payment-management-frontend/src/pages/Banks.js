import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  message,
  Tag,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, BankOutlined, GlobalOutlined, HomeOutlined, SafetyOutlined } from '@ant-design/icons';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';

const { Option } = Select;
const { confirm } = Modal;

const Banks = () => {
  // 添加样式
  const bankTableStyles = `
    .bank-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .bank-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .bank-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .bank-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .bank-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .bank-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .bank-table .ant-table-pagination .ant-pagination-item-active a {
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
    .search-form .ant-input {
      width: 100% !important;
    }
  `;

  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchBanks();
    fetchCountries();
  }, []);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/banks');
      if (result.success) {
        const banksData = result.data || [];
        setBanks(banksData);
        setFilteredBanks(banksData);
      } else {
        message.error(result.message || '获取银行列表失败');
        setBanks([]);
        setFilteredBanks([]);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      message.error('获取银行列表失败');
      setBanks([]);
      setFilteredBanks([]);
    }
    setLoading(false);
  };

  const fetchCountries = async () => {
    try {
      const result = await apiClient.get('/countries');
      if (result.success) {
        setCountries(result.data || []);
      } else {
        setCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  const handleCreate = () => {
    setEditingBank(null);
    form.resetFields();
    // 设置默认值，避免undefined
    form.setFieldsValue({
      CountryId: undefined,
      BankCode: '',
      BankName: '',
      BankType: 'Commercial',
      Website: '',
      IsActive: 'true'
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBank(record);
    form.setFieldsValue({
      CountryId: record.CountryId,
      BankCode: record.BankCode,
      BankName: record.BankName,
      BankType: record.BankType,
      Website: record.Website,
      IsActive: record.IsActive ? 'true' : 'false'
    });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个银行吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const result = await apiClient.delete(`/banks/${id}`);
          if (result.success) {
            message.success('删除成功');
            fetchBanks();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('Error deleting bank:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      // 清理数据，确保没有undefined值
      const cleanedValues = {
        CountryId: values.CountryId,
        BankCode: values.BankCode || '',
        BankName: values.BankName || '',
        BankType: values.BankType || 'Commercial',
        Website: values.Website || '',
        IsActive: values.IsActive
      };
      
      console.log('提交的数据:', cleanedValues); // 添加调试信息
      console.log('编辑状态:', editingBank ? '更新' : '新增');
      console.log('IsActive原始值:', values.IsActive);
      console.log('IsActive清理后值:', cleanedValues.IsActive);
      if (editingBank) {
        console.log('编辑的银行ID:', editingBank.Id);
      }
      
      if (editingBank) {
        const result = await apiClient.put(`/banks/${editingBank.Id}`, cleanedValues);
        if (result.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchBanks();
        } else {
          message.error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/banks', cleanedValues);
        if (result.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchBanks();
        } else {
          message.error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving bank:', error);
      message.error('保存失败');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.BankCode) params.append('bankCode', values.BankCode);
      if (values.BankName) params.append('bankName', values.BankName);
      if (values.BankType) params.append('bankType', values.BankType);
      if (values.CountryId) params.append('countryId', values.CountryId);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);
      
      const result = await apiClient.get(`/banks/search?${params.toString()}`);
      if (result.success) {
        setFilteredBanks(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredBanks([]);
      }
    } catch (error) {
      console.error('Error searching banks:', error);
      message.error('查询失败');
      setFilteredBanks([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重置时重新获取所有数据
    await fetchBanks();
  };

  const getBankTypeText = (type) => {
    const typeMap = {
      'Commercial': '商业银行',
      'Investment': '投资银行',
      'Central': '中央银行',
      'Other': '其他'
    };
    return typeMap[type] || type;
  };

  const getBankTypeColor = (type) => {
    const colorMap = {
      'Commercial': 'blue',
      'Investment': 'green',
      'Central': 'red',
      'Other': 'default'
    };
    return colorMap[type] || 'default';
  };

  const columns = [
    {
      title: '银行代码',
      dataIndex: 'BankCode',
      key: 'BankCode',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '银行名称',
      dataIndex: 'BankName',
      key: 'BankName',
    },
    {
      title: '所属国家',
      dataIndex: 'CountryName',
      key: 'CountryName',
      render: (text, record) => (
        <Space>
          <Tag color="green">{text}</Tag>
          <Tag color="orange">{record.CountryCode}</Tag>
        </Space>
      ),
    },
    {
      title: '银行类型',
      dataIndex: 'BankType',
      key: 'BankType',
      render: (type) => (
        <Tag color={getBankTypeColor(type)}>
          {getBankTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '官网',
      dataIndex: 'Website',
      key: 'Website',
      render: (text) => text ? (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (text) => new Date(text).toLocaleDateString(),
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
        <style>{bankTableStyles}</style>

        <Card
          title="银行管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增银行
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
                  <Form.Item name="BankCode" label="银行代码">
                    <Input placeholder="请输入银行代码" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="BankName" label="银行名称">
                    <Input placeholder="请输入银行名称" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="BankType" label="银行类型">
                    <Select placeholder="请选择银行类型" allowClear>
                      <Option value="Commercial">商业银行</Option>
                      <Option value="Investment">投资银行</Option>
                      <Option value="Central">中央银行</Option>
                      <Option value="Other">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="CountryId" label="所属国家">
                    <Select placeholder="请选择国家" allowClear>
                      {countries.map(country => (
                        <Option key={country.Id} value={country.Id}>
                          {country.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="IsActive" label="状态">
                    <Select placeholder="请选择状态" allowClear>
                      <Option value={true}>启用</Option>
                      <Option value={false}>禁用</Option>
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
            dataSource={filteredBanks}
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
            className="bank-table"
            scroll={{ x: 1200 }}
          />
        </Card>

        <Modal
          title={editingBank ? '编辑银行' : '新增银行'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="CountryId"
              label="所属国家"
              rules={[{ required: true, message: '请选择所属国家' }]}
            >
              <Select placeholder="请选择国家">
                {countries.map(country => (
                  <Option key={country.Id} value={country.Id}>
                    {country.Name} ({country.Code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="BankCode"
              label="银行代码"
              rules={[{ required: true, message: '请输入银行代码' }]}
            >
              <Input placeholder="如：ICBC, ABC, BOC" />
            </Form.Item>

            <Form.Item
              name="BankName"
              label="银行名称"
              rules={[{ required: true, message: '请输入银行名称' }]}
            >
              <Input placeholder="如：中国工商银行" />
            </Form.Item>

            <Form.Item
              name="BankType"
              label="银行类型"
              rules={[{ required: true, message: '请选择银行类型' }]}
            >
              <Select placeholder="请选择银行类型">
                <Option value="Commercial">商业银行</Option>
                <Option value="Investment">投资银行</Option>
                <Option value="Central">中央银行</Option>
                <Option value="Other">其他</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="Website"
              label="银行官网"
            >
              <Input placeholder="如：https://www.icbc.com.cn" />
            </Form.Item>

            <Form.Item
              name="IsActive"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="true">启用</Option>
                <Option value="false">禁用</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingBank ? '更新' : '创建'}
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

export default Banks;
