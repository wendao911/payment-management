import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Space,
  TreeSelect
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const SearchForm = ({
  form,
  onSearch,
  onReset,
  suppliers = [],
  contractTreeData = [],
  loading = false
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
          <Form.Item name="PayableNumber" label="应付编号">
            <Input placeholder="请输入应付编号" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="SupplierId" label="供应商">
            <Select
              placeholder="请选择供应商"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {suppliers.map(s => (
                <Option key={s.Id} value={s.Id}>
                  {s.Name || '未知供应商'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={7}>
          <Form.Item name="ContractId" label="合同" >
            <TreeSelect
              placeholder="请选择合同（支持搜索编号/名称）"
              treeData={contractTreeData}
              showSearch
              treeNodeFilterProp="title"
              filterTreeNode={(inputValue, treeNode) => treeNode.title.toLowerCase().includes(inputValue.toLowerCase())}
              allowClear
              dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 300 }}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="Status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              <Option value="pending">待付款</Option>
              <Option value="partial">部分付款</Option>
              <Option value="completed">已完成</Option>
              <Option value="overdue">逾期</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="Importance" label="重要程度">
            <Select placeholder="请选择重要程度" allowClear>
              <Option value="normal">一般</Option>
              <Option value="important">重要</Option>
              <Option value="very_important">非常重要</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="Urgency" label="紧急程度">
            <Select placeholder="请选择紧急程度" allowClear>
              <Option value="normal">一般</Option>
              <Option value="urgent">紧急</Option>
              <Option value="very_urgent">非常紧急</Option>
              <Option value="overdue">已延期</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item name="PaymentDueDateRange" label="付款到期日" style={{ whiteSpace: 'nowrap', marginBottom: 8 }}>
            <RangePicker placeholder={['开始日期', '结束日期']} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchForm;
