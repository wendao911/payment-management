import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Space, Button, message } from 'antd';
import { apiClient } from '../../../utils/api';

const { Option } = Select;

const SupplierModal = ({
  visible,
  editingSupplier,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && editingSupplier) {
      form.setFieldsValue({
        Name: editingSupplier.Name,
        ContactPerson: editingSupplier.ContactPerson,
        Phone: editingSupplier.Phone,
        Email: editingSupplier.Email,
        Address: editingSupplier.Address,
        TaxNumber: editingSupplier.TaxNumber,
        BankAccount: editingSupplier.BankAccount,
        BankName: editingSupplier.BankName,
        IsActive: editingSupplier.IsActive ? 'true' : 'false'
      });
    } else if (visible && !editingSupplier) {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        Name: '',
        ContactPerson: '',
        Phone: '',
        Email: '',
        Address: '',
        TaxNumber: '',
        BankAccount: '',
        BankName: '',
        IsActive: 'true'
      });
    }
  }, [visible, editingSupplier, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      // 清理数据，确保没有undefined值
      const cleanedValues = {
        Name: values.Name || '',
        ContactPerson: values.ContactPerson || '',
        Phone: values.Phone || '',
        Email: values.Email || '',
        Address: values.Address || '',
        TaxNumber: values.TaxNumber || '',
        BankAccount: values.BankAccount || '',
        BankName: values.BankName || '',
        IsActive: values.IsActive
      };
      
      console.log('提交的数据:', cleanedValues);
      
      if (editingSupplier) {
        const result = await apiClient.put(`/supplier/${editingSupplier.Id}`, cleanedValues);
        if (result.success) {
          message.success('更新成功');
          onSuccess();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } else {
        const result = await apiClient.post('/supplier', cleanedValues);
        if (result.success) {
          message.success('创建成功');
          onSuccess();
        } else {
          throw new Error(result.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingSupplier ? '编辑供应商' : '新增供应商'}
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
          label="供应商名称"
          rules={[{ required: true, message: '请输入供应商名称' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="ContactPerson"
          label="联系人"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="Phone"
          label="电话"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="Email"
          label="邮箱"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="Address"
          label="地址"
        >
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item
          name="TaxNumber"
          label="税号"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="BankAccount"
          label="银行账户"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="BankName"
          label="开户行"
        >
          <Input />
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
              {editingSupplier ? '更新' : '创建'}
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

export default SupplierModal;
