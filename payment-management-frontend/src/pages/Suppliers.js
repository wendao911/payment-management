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
  Row,
  Col,
  Select,
  Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, UserOutlined, PhoneOutlined, MailOutlined, BankOutlined } from '@ant-design/icons';
import { apiClient } from '../utils/api';
import ResizeObserverFix from '../components/ResizeObserverFix';

const { Option } = Select;
const { confirm } = Modal;

const Suppliers = () => {
  // 添加样式
  const supplierTableStyles = `
    .supplier-table .ant-table-thead > tr > th {
      background-color: #f0f8ff !important;
      color: #1890ff !important;
      font-weight: bold !important;
      border-color: #d9d9d9 !important;
    }
    
    .supplier-table .ant-table-tbody > tr > td {
      border-color: #f0f0f0 !important;
    }
    
    .supplier-table .ant-table-tbody > tr:hover > td {
      background-color: #f6ffed !important;
    }
    
    .supplier-table .ant-table-pagination {
      margin: 16px 0 !important;
    }
    
    .supplier-table .ant-table-pagination .ant-pagination-item {
      border-radius: 4px !important;
    }
    
    .supplier-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #1890ff !important;
      background-color: #1890ff !important;
    }
    
    .supplier-table .ant-table-pagination .ant-pagination-item-active a {
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

  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/supplier');
      if (result.success) {
        const suppliersData = result.data || [];
        setSuppliers(suppliersData);
        setFilteredSuppliers(suppliersData);
      } else {
        message.error(result.message || '获取供应商列表失败');
        setSuppliers([]);
        setFilteredSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('获取供应商列表失败');
      setSuppliers([]);
      setFilteredSuppliers([]);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    // 设置默认值
    form.setFieldsValue({
      Name: '',
      ContactPerson: '',
      Phone: '',
      Email: '',
      Address: '',
      TaxNumber: '',
      BankAccount: '',
      BankName: '',
      IsActive: 'true'
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue({
      Name: record.Name,
      ContactPerson: record.ContactPerson,
      Phone: record.Phone,
      Email: record.Email,
      Address: record.Address,
      TaxNumber: record.TaxNumber,
      BankAccount: record.BankAccount,
      BankName: record.BankName,
      IsActive: record.IsActive ? 'true' : 'false'
    });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个供应商吗？',
      onOk: async () => {
        try {
          const result = await apiClient.delete(`/supplier/${id}`);
          if (result.success) {
            message.success('删除成功');
            fetchSuppliers();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('Error deleting supplier:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      // 清理数据，确保没有undefined值
      const cleanedValues = {
        Name: values.Name || '',
        ContactPerson: values.ContactPerson || '',
        Phone: values.Phone || '',
        Email: values.Email || '',
        Address: values.Address || '',
        TaxNumber: values.TaxNumber || '',
        BankAccount: values.BankAccount || '',
        BankName: values.BankName || '',
        IsActive: values.IsActive
      };
      
      console.log('提交的数据:', cleanedValues);
      
      if (editingSupplier) {
        const result = await apiClient.put(`/supplier/${editingSupplier.Id}`, cleanedValues);
        if (result.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchSuppliers();
        } else {
          message.error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/supplier', cleanedValues);
        if (result.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchSuppliers();
        } else {
          message.error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      message.error('保存失败');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (values.Name) params.append('supplierName', values.Name);
      if (values.ContactPerson) params.append('contactPerson', values.ContactPerson);
      if (values.Phone) params.append('phone', values.Phone);
      if (values.Email) params.append('email', values.Email);
      if (values.IsActive !== undefined) params.append('isActive', values.IsActive);
      
      const result = await apiClient.get(`/supplier/search?${params.toString()}`);
      if (result.success) {
        setFilteredSuppliers(result.data || []);
      } else {
        message.error(result.message || '查询失败');
        setFilteredSuppliers([]);
      }
    } catch (error) {
      console.error('Error searching suppliers:', error);
      message.error('查询失败');
      setFilteredSuppliers([]);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重置时重新获取所有数据
    await fetchSuppliers();
  };

  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: '联系人',
      dataIndex: 'ContactPerson',
      key: 'ContactPerson',
    },
    {
      title: '电话',
      dataIndex: 'Phone',
      key: 'Phone',
    },
    {
      title: '邮箱',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: '地址',
      dataIndex: 'Address',
      key: 'Address',
      ellipsis: true,
    },
    {
      title: '税号',
      dataIndex: 'TaxNumber',
      key: 'TaxNumber',
    },
    {
      title: '银行账户',
      dataIndex: 'BankAccount',
      key: 'BankAccount',
    },
    {
      title: '开户行',
      dataIndex: 'BankName',
      key: 'BankName',
    },
    {
      title: '状态',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
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
        <style>{supplierTableStyles}</style>

        <Card
          title="供应商管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增供应商
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
                  <Form.Item name="Name" label="供应商名称">
                    <Input placeholder="请输入供应商名称" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="ContactPerson" label="联系人">
                    <Input placeholder="请输入联系人姓名" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="Phone" label="联系电话">
                    <Input placeholder="请输入联系电话" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="Email" label="邮箱">
                    <Input placeholder="请输入邮箱地址" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="IsActive" label="状态">
                    <Select placeholder="请选择状态" allowClear>
                      <Option value="true">启用</Option>
                      <Option value="false">禁用</Option>
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
            dataSource={filteredSuppliers}
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
            className="supplier-table"
            scroll={{ x: 1200 }}
          />
        </Card>

        <Modal
          title={editingSupplier ? '编辑供应商' : '新增供应商'}
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
              label="供应商名称"
              rules={[{ required: true, message: '请输入供应商名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="ContactPerson"
              label="联系人"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="Phone"
              label="电话"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="Email"
              label="邮箱"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="Address"
              label="地址"
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item
              name="TaxNumber"
              label="税号"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="BankAccount"
              label="银行账户"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="BankName"
              label="开户行"
            >
              <Input />
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
                  {editingSupplier ? '更新' : '创建'}
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

export default Suppliers;
