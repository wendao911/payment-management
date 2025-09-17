import React from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchForm = ({ OnSearch, OnReset }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    OnSearch(values);
  };

  const handleReset = () => {
    form.resetFields();
    OnReset();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: 16 }}
        size="middle"
        className="search-form"
      >
        <Row gutter={[16, 8]} style={{ width: '100%' }}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="Code" label="币种代码">
              <Input placeholder="请输入币种代码" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="Name" label="币种名称">
              <Input placeholder="请输入币种名称" allowClear />
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
        </Row>
        <Row justify="end" style={{ marginTop: 16 }}>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SearchForm;
