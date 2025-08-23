import React from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchForm = ({ banks, currencies, onSearch, onReset }) => {
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
        layout="vertical"
        onFinish={handleSubmit}
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
