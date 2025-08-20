import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Row, Col, Space, Button, message } from 'antd';
import { apiClient } from '../../../utils/api';

const { Option } = Select;

const BankModal = ({
  visible,
  editingBank,
  countries,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && editingBank) {
      form.setFieldsValue({
        CountryId: editingBank.CountryId,
        BankCode: editingBank.BankCode,
        BankName: editingBank.BankName,
        BankType: editingBank.BankType,
        Website: editingBank.Website,
        IsActive: editingBank.IsActive ? 'true' : 'false'
      });
    } else if (visible && !editingBank) {
      form.resetFields();
      // 设置默认值，避免undefined
      form.setFieldsValue({
        CountryId: undefined,
        BankCode: '',
        BankName: '',
        BankType: 'Commercial',
        Website: '',
        IsActive: 'true'
      });
    }
  }, [visible, editingBank, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      // 清理数据，确保没有undefined值
      const cleanedValues = {
        CountryId: values.CountryId,
        BankCode: values.BankCode || '',
        BankName: values.BankName || '',
        BankType: values.BankType || 'Commercial',
        Website: values.Website || '',
        IsActive: values.IsActive
      };
      
      if (editingBank) {
        const result = await apiClient.put(`/banks/${editingBank.Id}`, cleanedValues);
        if (result.success) {
          message.success('更新成功');
          onSuccess();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/banks', cleanedValues);
        if (result.success) {
          message.success('创建成功');
          onSuccess();
        } else {
          throw new Error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving bank:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingBank ? '编辑银行' : '新增银行'}
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
      >
        <Form.Item
          name="CountryId"
          label="所属国家"
          rules={[{ required: true, message: '请选择所属国家' }]}
        >
          <Select placeholder="请选择国家">
            {countries.map(country => (
              <Option key={country.Id} value={country.Id}>
                {country.Name} ({country.Code})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="BankCode"
          label="银行代码"
          rules={[{ required: true, message: '请输入银行代码' }]}
        >
          <Input placeholder="如：ICBC, ABC, BOC" />
        </Form.Item>

        <Form.Item
          name="BankName"
          label="银行名称"
          rules={[{ required: true, message: '请输入银行名称' }]}
        >
          <Input placeholder="如：中国工商银行" />
        </Form.Item>

        <Form.Item
          name="BankType"
          label="银行类型"
          rules={[{ required: true, message: '请选择银行类型' }]}
        >
          <Select placeholder="请选择银行类型">
            <Option value="Commercial">商业银行</Option>
            <Option value="Investment">投资银行</Option>
            <Option value="Central">中央银行</Option>
            <Option value="Other">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="Website"
          label="银行官网"
        >
          <Input placeholder="如：https://www.icbc.com.cn" />
        </Form.Item>

        <Form.Item
          name="IsActive"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value="true">启用</Option>
            <Option value="false">禁用</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              {editingBank ? '更新' : '创建'}
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

export default BankModal;
