import React, { useEffect, useState } from 'react';
import { Modal, Form, Row, Col, Input, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import AttachmentUpload from '../../components/common/AttachmentUpload';
import { apiClient } from '../../utils/api';

const { Option } = Select;

const ContractFormModal = ({ visible, onCancel, onSubmit, editingContract, suppliers, contracts }) => {
  const [form] = Form.useForm();
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (editingContract) {
      form.setFieldsValue({
        contractNumber: editingContract.ContractNumber,
        title: editingContract.Title,
        description: editingContract.Description,
        contractDate: editingContract.ContractDate ? dayjs(editingContract.ContractDate) : undefined,
        startDate: editingContract.StartDate ? dayjs(editingContract.StartDate) : undefined,
        endDate: editingContract.EndDate ? dayjs(editingContract.EndDate) : undefined,
        status: editingContract.Status,
        supplierId: editingContract.SupplierId,
        parentContractId: editingContract.ParentContractId,
      });
      // 拉取附件
      if (editingContract.Id) {
        fetchAttachments(editingContract.Id);
      } else {
        setAttachments([]);
      }
    } else {
      form.resetFields();
      setAttachments([]);
    }
  }, [editingContract, visible]);

  const fetchAttachments = async (contractId) => {
    try {
      const resp = await apiClient.get(`/attachment/contract/${contractId}`);
      if (resp.success) {
        setAttachments(resp.data || []);
      } else {
        setAttachments([]);
      }
    } catch (e) {
      setAttachments([]);
    }
  };

  const handleFinish = (values) => {
    onSubmit?.(values);
  };

  return (
    <Modal title={editingContract ? '编辑合同' : '新增合同'} open={visible} onCancel={onCancel} footer={null} width={800} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contractNumber" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
              <Input placeholder="请输入合同编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="title" label="合同标题" rules={[{ required: true, message: '请输入合同标题' }]}>
              <Input placeholder="请输入合同标题" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="supplierId" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select placeholder="请选择供应商">
                {(suppliers || []).map((s) => (
                  <Option key={s.Id} value={s.Id}>{s.Name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select placeholder="请选择状态">
                <Option value="draft">草稿</Option>
                <Option value="active">生效</Option>
                <Option value="completed">已完成</Option>
                <Option value="terminated">已终止</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contractDate" label="签订日期" rules={[{ required: true, message: '请选择签订日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="startDate" label="开始日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="endDate" label="结束日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="parentContractId" label="父合同">
              <Select placeholder="请选择父合同" allowClear>
                {(contracts || []).map((c) => (
                  <Option key={c.Id} value={c.Id}>{c.ContractNumber} - {c.Title}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="合同描述">
          <Input.TextArea rows={3} placeholder="请输入合同描述" />
        </Form.Item>

        {editingContract?.Id ? (
          <AttachmentUpload
            relatedTable="Contracts"
            relatedId={editingContract.Id}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            multiple
          />
        ) : null}

        <Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" htmlType="submit">{editingContract ? '更新' : '创建'}</Button>
            <Button onClick={onCancel}>取消</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContractFormModal;


