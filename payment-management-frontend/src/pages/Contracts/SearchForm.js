import React from 'react';
import { Form, Row, Col, Input, Select, DatePicker, Space, Button } from 'antd';

const { Option } = Select;
const { RangePicker } = DatePicker;

const SearchForm = ({ onSearch, onReset, suppliers }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    onSearch?.(values);
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  return (
    <Form form={form} layout="inline" onFinish={handleSubmit} className="search-form" size="middle">
      <Row gutter={[16, 8]} style={{ width: '100%' }}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="contractNumber" label="合同编号">
            <Input placeholder="请输入合同编号" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="title" label="合同标题">
            <Input placeholder="请输入合同标题" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="supplierId" label="供应商">
            <Select placeholder="请选择供应商" allowClear>
              {(suppliers || []).map((s) => (
                <Option key={s.Id} value={s.Id}>{s.Name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              <Option value="draft">草稿</Option>
              <Option value="active">生效</Option>
              <Option value="completed">已完成</Option>
              <Option value="terminated">已终止</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Form.Item name="dateRange" label="签订日期">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchForm;


