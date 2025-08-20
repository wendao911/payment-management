import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Row, Col, Space, Button, message } from 'antd';
import { apiClient } from '../../../utils/api';
import { getCurrencySymbol } from '../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;

const BalanceModal = ({
  visible,
  editingBalance,
  currentAccount,
  currencies,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && editingBalance) {
      form.setFieldsValue({
        bankAccountId: editingBalance.BankAccountId,
        balance: editingBalance.Balance,
        balanceStatus: editingBalance.BalanceStatus,
        notes: editingBalance.Notes || ''
      });
    } else if (visible && !editingBalance && currentAccount) {
      form.resetFields();
      form.setFieldsValue({
        bankAccountId: currentAccount.Id,
        balanceStatus: 'Available',
        notes: ''
      });
    }
  }, [visible, editingBalance, currentAccount, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingBalance) {
        const result = await apiClient.put(`/bank-account-balances/${editingBalance.Id}`, values);
        if (result.success) {
          message.success('更新成功');
          onSuccess();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/bank-account-balances', values);
        if (result.success) {
          message.success('创建成功');
          onSuccess();
        } else {
          throw new Error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving balance:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingBalance ? '编辑账户金额记录' : '新增账户金额记录'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          balanceStatus: 'Available',
          notes: ''
        }}
      >
        <Form.Item
          name="bankAccountId"
          hidden
        >
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="balance"
              label="账户金额"
              rules={[
                { required: true, message: '请输入账户金额' },
                {
                  validator: (_, value) => {
                    if (value && isNaN(parseFloat(value))) {
                      return Promise.reject(new Error('请输入有效的数字'));
                    }
                    if (value && parseFloat(value) < 0) {
                      return Promise.reject(new Error('金额不能为负数'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                type="number"
                step="0.01"
                placeholder="请输入账户金额"
                addonAfter={currentAccount ? getCurrencySymbol(currentAccount.CurrencyCode, currencies) : '元'}
                style={{ textAlign: 'right' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="balanceStatus"
              label="金额状态"
              rules={[{ required: true, message: '请选择金额状态' }]}
            >
              <Select placeholder="请选择金额状态">
                <Option value="Available">可用</Option>
                <Option value="Unavailable">不可用</Option>
                <Option value="Pending">待确认</Option>
                <Option value="Frozen">冻结</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="备注信息"
          rules={[
            { max: 500, message: '备注信息不能超过500个字符' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="请输入备注信息，如：工资发放、项目收款等"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={submitting}>
              取消
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              {editingBalance ? '更新' : '创建'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BalanceModal;
