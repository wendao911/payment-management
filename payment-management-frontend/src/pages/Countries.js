import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Card,
  message,
  Tag,
  Switch,
  Row,
  Col,
  Select,
  Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, GlobalOutlined, FlagOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';

const { confirm } = Modal;
const { Option } = Select;

const Countries = () => {
  // 添加样式
  const countryTableStyles = `
    .country-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .country-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .country-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .country-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .country-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .country-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .country-table .ant-table-pagination .ant-pagination-item-active a {
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

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/countries');
      if (result.success) {
        const countriesData = result.data || [];
        setCountries(countriesData);
        setFilteredCountries(countriesData);
      } else {
        message.error(result.message || '获取国家列表失败');
        setCountries([]);
        setFilteredCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      message.error('获取国家列表失败');
      setCountries([]);
      setFilteredCountries([]);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingCountry(null);
    form.resetFields();
    // 设置默认状态为启用
    form.setFieldsValue({
      IsActive: true
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCountry(record);
    form.setFieldsValue({
      Code: record.Code,
      Name: record.Name,
      CurrencyCode: record.CurrencyCode,
      IsActive: record.IsActive
    });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个国家吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const result = await apiClient.delete(`/countries/${id}`);
          if (result.success) {
            message.success('删除成功');
            fetchCountries();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('Error deleting country:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      console.log('提交的表单数据:', values);
      console.log('编辑状态:', editingCountry);

      if (editingCountry) {
        console.log('更新国家，ID:', editingCountry.Id);
        const result = await apiClient.put(`/countries/${editingCountry.Id}`, values);
        if (result.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchCountries();
        } else {
          message.error(result.message || '更新失败');
        }
      } else {
        console.log('创建新国家');
        const result = await apiClient.post('/countries', values);
        if (result.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchCountries();
        } else {
          message.error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving country:', error);
      message.error('保存失败');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.countryCode) params.append('code', values.countryCode);
      if (values.countryName) params.append('name', values.countryName);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);

      const result = await apiClient.get(`/countries/search?${params.toString()}`);
      if (result.success) {
        setFilteredCountries(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredCountries([]);
      }
    } catch (error) {
      console.error('Error searching countries:', error);
      message.error('查询失败');
      setFilteredCountries([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重置时重新获取所有数据
    await fetchCountries();
  };

  const columns = [
    {
      title: '国家代码',
      dataIndex: 'Code',
      key: 'Code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '国家名称',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: '默认货币',
      dataIndex: 'CurrencyCode',
      key: 'CurrencyCode',
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-',
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
        <style>{countryTableStyles}</style>

        <Card
          title="国家管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增国家
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
                  <Form.Item name="Name" label="国家名称">
                    <Input placeholder="请输入国家名称" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="Code" label="国家代码">
                    <Input placeholder="请输入国家代码" allowClear />
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
            dataSource={filteredCountries}
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
            className="country-table"
            scroll={{ x: 1200 }}
          />
        </Card>

        <Modal
          title={editingCountry ? '编辑国家' : '新增国家'}
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
              name="Name"
              label="国家名称"
              rules={[{ required: true, message: '请输入国家名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="Code"
              label="国家代码"
              rules={[{ required: true, message: '请输入国家代码' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="CurrencyCode"
              label="货币代码"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="IsActive"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value={true}>启用</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingCountry ? '更新' : '创建'}
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

export default Countries;
