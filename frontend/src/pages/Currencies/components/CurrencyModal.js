import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { apiClient } from '../../../utils/api';

const CurrencyModal = ({ Visible, EditingCurrency, OnCancel, OnSuccess }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (Visible) {
      if (EditingCurrency) {
        form.setFieldsValue({
          Code: EditingCurrency.Code,
          Name: EditingCurrency.Name,
          Symbol: EditingCurrency.Symbol,
          ExchangeRate: Number(EditingCurrency.ExchangeRate),
          IsActive: EditingCurrency.IsActive
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          IsActive: true,
          ExchangeRate: 1.000000
        });
      }
    }
  }, [Visible, EditingCurrency, form]);

  const HandleSubmit = async () => {
    try {
      const Values = await form.validateFields();
      
      // 确保汇率是数字类型
      if (Values.ExchangeRate !== undefined && Values.ExchangeRate !== null) {
        Values.ExchangeRate = Number(Values.ExchangeRate);
      }
      
      if (EditingCurrency) {
        // 更新币种
        const Response = await apiClient.put(`/currencies/${EditingCurrency.Id}`, Values);
        if (Response.success) {
          message.success('更新成功');
          OnSuccess();
        } else {
          console.error('更新失败:', Response);
          message.error(Response.message || '更新失败');
        }
      } else {
        // 创建币种
        const Response = await apiClient.post('/currencies', Values);
        if (Response.success) {
          message.success('创建成功');
          OnSuccess();
        } else {
          console.error('创建失败:', Response);
          message.error(Response.message || '创建失败');
        }
      }
    } catch (Error) {
      if (Error.errorFields) {
        message.error('请检查表单输入');
      } else {
        console.error('提交失败:', Error);
        message.error('操作失败');
      }
    }
  };

  const HandleCancel = () => {
    form.resetFields();
    OnCancel();
  };

  return (
    <Modal
      title={EditingCurrency ? '编辑币种' : '新增币种'}
      open={Visible}
      onOk={HandleSubmit}
      onCancel={HandleCancel}
      width={600}
      destroyOnClose
      className="currency-modal"
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="Code"
          label="币种代码"
          rules={[
            { required: true, message: '请输入币种代码' },
            { min: 1, max: 3, message: '币种代码长度必须在1-3个字符之间' }
          ]}
        >
          <Input
            placeholder="请输入币种代码，如：USD、CNY、EUR"
            maxLength={3}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="Name"
          label="币种名称"
          rules={[
            { required: true, message: '请输入币种名称' },
            { min: 1, max: 50, message: '币种名称长度必须在1-50个字符之间' }
          ]}
        >
          <Input
            placeholder="请输入币种名称，如：美元、人民币、欧元"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="Symbol"
          label="币种符号"
          rules={[
            { max: 10, message: '币种符号长度不能超过10个字符' }
          ]}
        >
          <Input
            placeholder="请输入币种符号，如：$、¥、€"
            maxLength={10}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="ExchangeRate"
          label="对美元汇率"
          rules={[
            { required: true, message: '请输入对美元汇率' },
            {
              validator: (_, value) => {
                if (value === null || value === undefined || value === '') {
                  return Promise.reject(new Error('请输入对美元汇率'));
                }
                const numValue = Number(value);
                if (isNaN(numValue)) {
                  return Promise.reject(new Error('汇率必须是有效数字'));
                }
                if (numValue < 0) {
                  return Promise.reject(new Error('汇率必须是非负数'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            placeholder="请输入对美元汇率"
            min={0}
            precision={6}
            style={{ width: '100%' }}
            addonAfter="USD"
            parser={(value) => {
              if (value === '') return null;
              return Number(value);
            }}
            formatter={(value) => {
              if (value === null || value === undefined) return '';
              return Number(value).toFixed(6);
            }}
          />
        </Form.Item>

        <Form.Item
          name="IsActive"
          label="启用状态"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CurrencyModal;
