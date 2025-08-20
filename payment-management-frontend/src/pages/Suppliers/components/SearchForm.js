import React from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchForm = ({ onSearch, onReset }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    onSearch(values);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="inline"
        onFinish={handleSubmit}
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
  );
};

export default SearchForm;
