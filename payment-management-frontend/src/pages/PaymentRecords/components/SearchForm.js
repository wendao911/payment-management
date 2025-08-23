import React from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Button, TreeSelect, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchForm = ({
  form,
  onSearch,
  onReset,
  onExport,
  payables = [],
  suppliers = [],
  contractTreeData = [],
  loading = false,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSearch}
      style={{ marginBottom: 16 }}
      size="middle"
      className="search-form"
    >
      <Row gutter={[16, 8]} style={{ width: '100%' }}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="paymentNumber" label="付款编号">
            <Input placeholder="请输入付款编号" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="payableManagementId" label="应付管理">
            <Select
              placeholder="请选择应付管理"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {payables.map(payable => (
                <Option key={payable.Id} value={payable.Id}>
                  {payable.PayableNumber || payable.payableNumber}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="supplierId" label="供应商">
            <Select
              placeholder="请选择供应商"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {suppliers.map(s => (
                <Option key={s.Id} value={s.Id}>{s.Name || '未知供应商'}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={7}>
          <Form.Item name="contractId" label="合同">
            <TreeSelect
              placeholder="请选择合同（支持搜索编号/名称）"
              treeData={contractTreeData}
              showSearch
              treeNodeFilterProp="title"
              filterTreeNode={(inputValue, treeNode) => treeNode.title.toLowerCase().includes(inputValue.toLowerCase())}
              allowClear
              dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 320 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item name="paymentDateRange" label="付款日期">
            <DatePicker.RangePicker placeholder={["开始日期", "结束日期"]} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset} disabled={loading}>
              重置
            </Button>
            <Button 
              type="default" 
              icon={<DownloadOutlined />} 
              onClick={onExport} 
              disabled={loading}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              导出Excel
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchForm;
