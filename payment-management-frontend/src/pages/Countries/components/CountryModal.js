import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Space, Button, message } from 'antd';
import { apiClient } from '../../../utils/api';

const { Option } = Select;

const CountryModal = ({
  visible,
  editingCountry,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && editingCountry) {
      form.setFieldsValue({
        Code: editingCountry.Code,
        Name: editingCountry.Name,
        CurrencyCode: editingCountry.CurrencyCode,
        IsActive: editingCountry.IsActive ? 'true' : 'false'
      });
    } else if (visible && !editingCountry) {
      form.resetFields();
      // 设置默认状态为启用
      form.setFieldsValue({
        IsActive: 'true'
      });
    }
  }, [visible, editingCountry, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      console.log('提交的表单数据:', values);
      console.log('编辑状态:', editingCountry);

      if (editingCountry) {
        console.log('更新国家，ID:', editingCountry.Id);
        const result = await apiClient.put(`/countries/${editingCountry.Id}`, values);
        if (result.success) {
          message.success('更新成功');
          onSuccess();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } else {
        console.log('创建新国家');
        const result = await apiClient.post('/countries', values);
        if (result.success) {
          message.success('创建成功');
          onSuccess();
        } else {
          throw new Error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving country:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingCountry ? '编辑国家' : '新增国家'}
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
          name="Name"
          label="国家名称"
          rules={[{ required: true, message: '请输入国家名称' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="Code"
          label="国家代码"
          rules={[{ required: true, message: '请输入国家代码' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="CurrencyCode"
          label="货币代码"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="IsActive"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value={true}>启用</Option>
            <Option value={false}>禁用</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              {editingCountry ? '更新' : '创建'}
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

export default CountryModal;
