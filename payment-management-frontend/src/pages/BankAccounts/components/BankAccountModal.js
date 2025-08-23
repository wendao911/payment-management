import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Space, Button, message } from 'antd';
import { apiClient } from '../../../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const BankAccountModal = ({
  visible,
  editingAccount,
  banks,
  currencies,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && editingAccount) {
      // 字段名称映射：从数据库字段名映射到表单字段名
      const formData = {
        BankId: editingAccount.BankId,
        AccountNumber: editingAccount.AccountNumber,
        AccountName: editingAccount.AccountName,
        AccountType: editingAccount.AccountType,
        CurrencyCode: editingAccount.CurrencyCode,
        InitialBalance: editingAccount.InitialBalance,
        Notes: editingAccount.Notes
      };
      form.setFieldsValue(formData);
    } else if (visible && !editingAccount) {
      form.resetFields();
    }
  }, [visible, editingAccount, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingAccount) {
        const result = await apiClient.put(`/bank-accounts/${editingAccount.Id}`, values);
        if (result.success) {
          message.success('更新成功');
          onSuccess();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/bank-accounts', values);
        if (result.success) {
          message.success('创建成功');
          onSuccess();
        } else {
          throw new Error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingAccount ? '编辑银行账户' : '新增银行账户'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="BankId"
              label="所属银行"
              rules={[{ required: true, message: '请选择所属银行' }]}
            >
              <Select placeholder="请选择银行">
                {banks.map(bank => (
                  <Option key={bank.Id} value={bank.Id}>
                    {bank.BankName} ({bank.BankCode})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="AccountNumber"
              label="账户号码"
              rules={[{ required: true, message: '请输入账户号码' }]}
            >
              <Input placeholder="如：6222021234567890123" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="AccountName"
              label="账户名称"
              rules={[{ required: true, message: '请输入账户名称' }]}
            >
              <Input placeholder="如：公司基本账户" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="AccountType"
              label="账户类型"
              rules={[{ required: true, message: '请选择账户类型' }]}
            >
              <Select placeholder="请选择账户类型">
                <Option value="Checking">活期账户</Option>
                <Option value="Savings">储蓄账户</Option>
                <Option value="Investment">投资账户</Option>
                <Option value="Other">其他账户</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="CurrencyCode"
              label="账户币种"
              rules={[{ required: true, message: '请选择账户币种' }]}
            >
              <Select placeholder="请选择币种" showSearch optionFilterProp="children">
                {currencies.map(currency => (
                  <Option key={currency.Code} value={currency.Code}>
                    {currency.Symbol} {currency.Name} ({currency.Code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="InitialBalance"
              label="初始余额"
              rules={[
                { required: true, message: '请输入初始余额' },
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined || value === '') {
                      return Promise.resolve();
                    }
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                      return Promise.reject(new Error('请输入有效的数字'));
                    }
                    if (numValue < 0) {
                      return Promise.reject(new Error('初始余额不能为负数'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                precision={2}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="Notes"
          label="备注"
        >
          <TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              {editingAccount ? '更新' : '创建'}
            </Button>
            <Button onClick={onCancel} disabled={submitting}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BankAccountModal;
