import React from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchForm = ({ countries, onSearch, onReset }) => {
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
  );
};

export default SearchForm;
