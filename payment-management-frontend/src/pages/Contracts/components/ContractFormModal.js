import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, TreeSelect, message } from 'antd';
import dayjs from '../../../utils/dayjs';

const { Option } = Select;

const ContractFormModal = ({
  visible,
  onCancel,
  onSubmit,
  editingContract,
  suppliers = [],
  contracts = [],
  contractTreeData = []
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && editingContract) {
      form.setFieldsValue({
        contractNumber: editingContract.ContractNumber,
        title: editingContract.Title,
        description: editingContract.Description,
        contractDate: editingContract.ContractDate ? dayjs(editingContract.ContractDate) : null,
        startDate: editingContract.StartDate ? dayjs(editingContract.StartDate) : null,
        endDate: editingContract.EndDate ? dayjs(editingContract.EndDate) : null,
        status: editingContract.Status,
        supplierId: editingContract.SupplierId,
        parentContractId: editingContract.ParentContractId,
      });
    } else {
      form.resetFields();
    }
  }, [visible, editingContract, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit({ ...values, editingContract });
      if (success) {
        form.resetFields();
      }
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
      title={editingContract ? '编辑合同' : '新增合同'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="contractNumber"
          label="合同编号"
          rules={[{ required: true, message: '请输入合同编号' }]}
        >
          <Input placeholder="请输入合同编号" />
        </Form.Item>

        <Form.Item
          name="title"
          label="合同标题"
          rules={[{ required: true, message: '请输入合同标题' }]}
        >
          <Input placeholder="请输入合同标题" />
        </Form.Item>

        <Form.Item
          name="description"
          label="合同描述"
        >
          <Input.TextArea rows={3} placeholder="请输入合同描述" />
        </Form.Item>

        <Form.Item
          name="supplierId"
          label="供应商"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select
            placeholder="请选择供应商"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {suppliers.map(s => (
              <Option key={s.Id} value={s.Id}>{s.Name || '未知供应商'}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value="active">激活</Option>
            <Option value="inactive">非激活</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="parentContractId"
          label="父合同"
        >
          <TreeSelect
            placeholder="请选择父合同（可选）"
            treeData={contractTreeData}
            showSearch
            treeNodeFilterProp="title"
            filterTreeNode={(inputValue, treeNode) => treeNode.title.toLowerCase().includes(inputValue.toLowerCase())}
            allowClear
            dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 320 }}
          />
        </Form.Item>

        <Form.Item
          name="contractDate"
          label="合同日期"
        >
          <DatePicker placeholder="请选择合同日期" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="开始日期"
        >
          <DatePicker placeholder="请选择开始日期" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="结束日期"
        >
          <DatePicker placeholder="请选择结束日期" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContractFormModal;
