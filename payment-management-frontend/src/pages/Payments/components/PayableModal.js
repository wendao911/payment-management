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
import dayjs from '../../../utils/dayjs';
import AttachmentUpload from '../../../components/common/AttachmentUpload';

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
          PayableNumber: editingPayable.PayableNumber || editingPayable.payableNumber || '',
          ContractId: editingPayable.ContractId || editingPayable.contract?.Id || editingPayable.contractId,
          SupplierId: editingPayable.SupplierId || editingPayable.supplier?.Id || editingPayable.supplierId,
          PayableAmount: numericAmount,
          CurrencyCode: editingPayable.CurrencyCode || editingPayable.currencyCode || 'USD',
          PaymentDueDate: editingPayable.PaymentDueDate ? dayjs(editingPayable.PaymentDueDate) : undefined,
          Importance: editingPayable.Importance || editingPayable.importance || 'normal',
          Urgency: editingPayable.Urgency || editingPayable.urgency || 'normal',
          Description: editingPayable.Description || editingPayable.description || '',
          Notes: editingPayable.Notes || editingPayable.notes || '',
        });

        // 调试日志
        console.log('Setting form values for editing:', {
          PayableNumber: editingPayable.PayableNumber || editingPayable.payableNumber,
          ContractId: editingPayable.ContractId || editingPayable.contract?.Id,
          SupplierId: editingPayable.SupplierId || editingPayable.supplier?.Id,
          PayableAmount: {
            original: editingPayable.PayableAmount || editingPayable.payableAmount,
            type: typeof (editingPayable.PayableAmount || editingPayable.payableAmount),
            converted: numericAmount
          },
          CurrencyCode: editingPayable.CurrencyCode || editingPayable.currencyCode,
          PaymentDueDate: editingPayable.PaymentDueDate,
          Importance: editingPayable.Importance || editingPayable.importance,
          Urgency: editingPayable.Urgency || editingPayable.urgency,
          Description: editingPayable.Description || editingPayable.description,
          Notes: editingPayable.Notes || editingPayable.notes,
        });

        // 初始化本地附件状态
        setLocalAttachments(editingPayable?.attachments || []);
      } else {
        // 新增模式：重置表单并设置默认值
        form.resetFields();
        form.setFieldsValue({
          CurrencyCode: 'USD', // 默认选择美元
          Importance: 'normal', // 默认重要程度
          Urgency: 'normal', // 默认紧急程度
          PaymentDueDate: dayjs(), // 默认付款截止日期为今天
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
        PayableNumber: values.PayableNumber,
        ContractId: parseInt(values.ContractId),
        SupplierId: parseInt(values.SupplierId),
        PayableAmount: parseFloat(values.PayableAmount) || 0,
        PaymentDueDate: values.PaymentDueDate.format('YYYY-MM-DD')
      };

      console.log('Submitting form data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form validation failed:', error);
      // 显示具体的验证错误信息
      if (error.errorFields && error.errorFields.length > 0) {
        const errorMessages = error.errorFields.map(field => field.errors.join(', ')).join('\n');
        console.error('Validation errors:', errorMessages);
      }
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
              name="PayableNumber"
              label="应付编号"
              rules={[{ required: true, message: '请输入应付编号' }]}
            >
              <Input placeholder="请输入应付编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="Description"
              label="应付说明"
              rules={[{ required: true, message: '请输入应付说明' }]}
            >
              <Input placeholder="请输入应付说明" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ContractId"
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
                      form.setFieldsValue({ SupplierId: selectedContract.SupplierId });
                    }
                  } else {
                    // 当合同被清除时，也清除供应商
                    console.log('Contract cleared, clearing supplier');
                    form.setFieldsValue({ SupplierId: undefined });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="SupplierId"
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
                disabled={form.getFieldValue('ContractId') && findContractById(contracts, form.getFieldValue('ContractId'))?.SupplierId}
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
              name="CurrencyCode"
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
              name="PayableAmount"
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
              name="Urgency"
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
          name="PaymentDueDate"
          label="付款截止日期"
          rules={[{ required: true, message: '请选择付款截止日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="Importance"
          label="重要程度"
        >
          <Select placeholder="请选择重要程度">
            <Option value="normal">一般</Option>
            <Option value="important">重要</Option>
            <Option value="very_important">非常重要</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="Notes"
          label="备注"
          rules={[{ max: 500, message: '备注不能超过500个字符' }]}
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
