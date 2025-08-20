import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Row,
  Col,
  Space,
  Button,
  TreeSelect
} from 'antd';
import dayjs from 'dayjs';
import AttachmentUpload from '../../components/common/AttachmentUpload';

const { Option } = Select;
const { TextArea } = Input;

const PayableModal = ({
  visible,
  onCancel,
  onSubmit,
  editingPayable,
  currencies = [],
  suppliers = [],
  contractTreeData = [],
  contracts = [],
  loading = false
}) => {
  const [form] = Form.useForm();
  const [localAttachments, setLocalAttachments] = React.useState([]);

  // 根据合同ID查找合同信息的辅助函数
  const findContractById = (contracts, contractId) => {
    for (const contract of contracts) {
      if (contract.Id === contractId) {
        return contract;
      }
      // 递归查找子合同
      if (contract.children && contract.children.length > 0) {
        const found = findContractById(contract.children, contractId);
        if (found) return found;
      }
    }
    return null;
  };

  // 当编辑数据变化时，设置表单值
  useEffect(() => {
    if (visible) {
      if (editingPayable) {
        // 编辑模式：设置现有数据
        // 优先使用后端返回的完整数据，兼容前端现有数据结构
        const payableAmount = editingPayable.PayableAmount || editingPayable.payableAmount;
        const numericAmount = payableAmount ? parseFloat(payableAmount) : 0;
        
        form.setFieldsValue({
          payableNumber: editingPayable.PayableNumber || editingPayable.payableNumber || '',
          contractId: editingPayable.ContractId || editingPayable.contract?.Id || editingPayable.contractId,
          supplierId: editingPayable.SupplierId || editingPayable.supplier?.Id || editingPayable.supplierId,
          payableAmount: numericAmount,
          currencyCode: editingPayable.CurrencyCode || editingPayable.currencyCode || 'USD',
          paymentDueDate: editingPayable.PaymentDueDate ? dayjs(editingPayable.PaymentDueDate) : undefined,
          importance: editingPayable.Importance || editingPayable.importance || 'normal',
          urgency: editingPayable.Urgency || editingPayable.urgency || 'normal',
          description: editingPayable.Description || editingPayable.description || '',
        });
        
        // 调试日志
        console.log('Setting form values for editing:', {
          payableNumber: editingPayable.PayableNumber || editingPayable.payableNumber,
          contractId: editingPayable.ContractId || editingPayable.contract?.Id,
          supplierId: editingPayable.SupplierId || editingPayable.supplier?.Id,
          payableAmount: {
            original: editingPayable.PayableAmount || editingPayable.payableAmount,
            type: typeof (editingPayable.PayableAmount || editingPayable.payableAmount),
            converted: numericAmount
          },
          currencyCode: editingPayable.CurrencyCode || editingPayable.currencyCode,
          paymentDueDate: editingPayable.PaymentDueDate,
          importance: editingPayable.Importance || editingPayable.importance,
          urgency: editingPayable.Urgency || editingPayable.urgency,
          description: editingPayable.Description || editingPayable.description,
        });
        
        // 初始化本地附件状态
        setLocalAttachments(editingPayable?.attachments || []);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          currencyCode: 'USD', // 默认选择美元
        });
        
        // 重置本地附件状态
        setLocalAttachments([]);
      }
    }
  }, [visible, editingPayable, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 数据类型转换和验证
      const submitData = {
        ...values,
        payableNumber: values.payableNumber,
        contractId: parseInt(values.contractId),
        supplierId: parseInt(values.supplierId),
        payableAmount: parseFloat(values.payableAmount) || 0,
        paymentDueDate: values.paymentDueDate.format('YYYY-MM-DD')
      };

      console.log('Submitting form data:', submitData);
      const result = await onSubmit(submitData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editingPayable ? '编辑应付' : '新增应付'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="middle"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="payableNumber"
              label="应付编号"
              rules={[{ required: true, message: '请输入应付编号' }]}
            >
              <Input placeholder="请输入应付编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contractId"
              label="合同"
              rules={[{ required: true, message: '请选择合同' }]}
            >
              <TreeSelect
                placeholder="请选择合同"
                treeData={contractTreeData}
                showSearch
                treeNodeFilterProp="title"
                filterTreeNode={(inputValue, treeNode) => {
                  return treeNode.title.toLowerCase().includes(inputValue.toLowerCase());
                }}
                allowClear
                treeDefaultExpandAll
                dropdownStyle={{
                  maxHeight: 400,
                  overflow: 'auto',
                  minWidth: 300
                }}
                notFoundContent="未找到匹配的合同"
                treeNodeLabelProp="title"
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                maxTagCount={1}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}个合同`}
                style={{ width: '100%' }}
                size="middle"
                onChange={(value) => {
                  console.log('Contract selected:', value);
                  // 根据选择的合同自动设置供应商
                  if (value) {
                    const selectedContract = findContractById(contracts, value);
                    if (selectedContract && selectedContract.SupplierId) {
                      console.log('Auto-setting supplier:', selectedContract.SupplierId);
                      form.setFieldsValue({ supplierId: selectedContract.SupplierId });
                    }
                  } else {
                    // 当合同被清除时，也清除供应商
                    console.log('Contract cleared, clearing supplier');
                    form.setFieldsValue({ supplierId: undefined });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplierId"
              label="供应商"
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <Select
                placeholder="请选择供应商"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent="未找到匹配的供应商"
                onChange={(value) => {
                  console.log('Supplier selected:', value);
                  console.log('Form values after selection:', form.getFieldsValue());
                }}
                disabled={form.getFieldValue('contractId') && findContractById(contracts, form.getFieldValue('contractId'))?.SupplierId}
              >
                {suppliers.map(supplier => (
                  <Option key={supplier.Id} value={supplier.Id}>
                    {supplier.Name || '未知供应商'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="currencyCode"
              label="币种"
              rules={[{ required: true, message: '请选择币种' }]}
            >
              <Select placeholder="请选择币种">
                {currencies.map(currency => (
                  <Option key={currency.Code} value={currency.Code}>
                    {currency.Symbol} {currency.Name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="payableAmount"
              label="应付金额"
              rules={[
                { required: true, message: '请输入应付金额' },
                { 
                  validator: (_, value) => {
                    if (value === null || value === undefined || value === '') {
                      return Promise.reject(new Error('请输入应付金额'));
                    }
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || numValue <= 0) {
                      return Promise.reject(new Error('应付金额必须大于0'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/(,*)/g, '')}
                precision={2}
                min={0.01}
                step={0.01}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="urgency"
              label="紧急程度"
            >
              <Select placeholder="请选择紧急程度">
                <Option value="normal">一般</Option>
                <Option value="urgent">紧急</Option>
                <Option value="very_urgent">非常紧急</Option>
                <Option value="overdue">已延期</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="paymentDueDate"
          label="付款截止日期"
          rules={[{ required: true, message: '请选择付款截止日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="importance"
          label="重要程度"
        >
          <Select placeholder="请选择重要程度">
            <Option value="normal">一般</Option>
            <Option value="important">重要</Option>
            <Option value="very_important">非常重要</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="备注"
        >
          <TextArea rows={3} />
        </Form.Item>

        {/* 附件上传 */}
        {editingPayable && (
          <Form.Item label="附件">
            <AttachmentUpload
              relatedTable="PayableManagement"
              relatedId={editingPayable?.Id || editingPayable?.id}
              attachments={localAttachments}
              onAttachmentsChange={(attachments) => {
                // 更新本地附件状态
                setLocalAttachments(attachments);
                console.log('Attachments changed:', attachments);
              }}
              maxFileSize={10}
              multiple={true}
            />
          </Form.Item>
        )}

        <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              {editingPayable ? '更新' : '创建'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayableModal;
