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
  Button
} from 'antd';
import dayjs from 'dayjs';
import AttachmentUpload from '../../components/common/AttachmentUpload';

const { Option } = Select;
const { TextArea } = Input;

const PaymentRecordModal = ({
  visible,
  onCancel,
  onSubmit,
  editingRecord,
  currencies = [],
  payableId,
  loading = false,
  isEdit = false
}) => {
  const [form] = Form.useForm();
  const [localAttachments, setLocalAttachments] = React.useState([]);

  // 当编辑数据变化时，设置表单值
  useEffect(() => {
    if (visible) {
      if (editingRecord && isEdit) {
        // 编辑模式：设置现有数据
        form.setFieldsValue({
          paymentNumber: editingRecord.PaymentNumber || editingRecord.paymentNumber || '',
          currencyCode: editingRecord.CurrencyCode || editingRecord.currencyCode || 'USD',
          paymentDescription: editingRecord.PaymentDescription || editingRecord.paymentDescription || '',
          paymentAmount: editingRecord.PaymentAmount || editingRecord.paymentAmount || 0,
          paymentDate: editingRecord.PaymentDate ? dayjs(editingRecord.PaymentDate) :
            (editingRecord.paymentDate ? dayjs(editingRecord.paymentDate) : null),
          notes: editingRecord.Notes || editingRecord.notes || '',
        });
        
        // 初始化本地附件状态
        setLocalAttachments(editingRecord?.attachments || []);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          currencyCode: 'USD',
          paymentDate: dayjs()
        });
        
        // 重置本地附件状态
        setLocalAttachments([]);
      }
    }
  }, [visible, editingRecord, isEdit, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        paymentNumber: values.paymentNumber,
        currencyCode: values.currencyCode,
        paymentDescription: values.paymentDescription,
        paymentAmount: parseFloat(values.paymentAmount),
        paymentDate: values.paymentDate ? dayjs(values.paymentDate).format('YYYY-MM-DD') : undefined,
        notes: values.notes
      };

      const result = await onSubmit(submitData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const getModalTitle = () => {
    if (isEdit) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>编辑付款记录</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>新增付款记录</span>
      </div>
    );
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
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
              name="paymentNumber"
              label="付款编号"
              rules={[
                { required: true, message: '请输入付款编号' },
                { min: 3, message: '付款编号至少3个字符' },
                { max: 50, message: '付款编号不能超过50个字符' }
              ]}
            >
              <Input
                placeholder="请输入付款编号，如：PAY-2024-001"
                showCount
                maxLength={50}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="currencyCode"
              label="币种"
              rules={[{ required: true, message: '请选择币种' }]}
            >
              <Select
                placeholder="请选择币种"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {currencies.map(currency => (
                  <Option key={currency.Code} value={currency.Code}>
                    <span style={{ fontWeight: 'bold' }}>
                      {currency.Symbol} {currency.Name}
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="paymentDescription"
              label="付款说明"
              rules={[
                { required: true, message: '请输入付款说明' },
                { min: 5, message: '付款说明至少5个字符' },
                { max: 200, message: '付款说明不能超过200个字符' }
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="请输入付款说明，如：项目进度款、材料采购款等"
                showCount
                maxLength={200}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="paymentAmount"
              label="付款金额"
              rules={[
                { required: true, message: '请输入付款金额' },
                {
                  validator: (_, value) => {
                    if (!value || value === '') {
                      return Promise.reject(new Error('请输入付款金额'));
                    }
                    if (isNaN(parseFloat(value))) {
                      return Promise.reject(new Error('请输入有效的数字'));
                    }
                    if (parseFloat(value) <= 0) {
                      return Promise.reject(new Error('付款金额必须大于0'));
                    }
                    if (parseFloat(value) > 999999999.99) {
                      return Promise.reject(new Error('付款金额不能超过999,999,999.99'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入付款金额"
                precision={2}
                min={0.01}
                max={999999999.99}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/(,*)/g, '')}
                addonAfter={
                  <span style={{ color: '#666' }}>
                    {form.getFieldValue('currencyCode') || 'USD'}
                  </span>
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="paymentDate"
              label="付款日期"
              rules={[
                { required: true, message: '请选择付款日期' },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(new Error('请选择付款日期'));
                    }
                    const selectedDate = dayjs(value);
                    const today = dayjs();
                    if (selectedDate.isAfter(today, 'day')) {
                      return Promise.reject(new Error('付款日期不能超过今天'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择付款日期"
                disabledDate={(current) => {
                  // 禁用未来日期
                  return current && current > dayjs().endOf('day');
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="notes"
              label="备注信息"
              rules={[
                { max: 500, message: '备注信息不能超过500个字符' }
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="请输入备注信息，如：付款原因、特殊说明等"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 附件上传 */}
        {isEdit && (
          <Form.Item label="附件上传">
            <AttachmentUpload
              relatedTable="PaymentRecords"
              relatedId={editingRecord?.Id || editingRecord?.id}
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
              {isEdit ? '保存更改' : '创建付款记录'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentRecordModal;
