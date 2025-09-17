import React from 'react';
import { Modal, Row, Col, Card, Tag, Button, Space } from 'antd';
import dayjs from '../../../utils/dayjs';
import AttachmentUpload from '../../../components/common/AttachmentUpload';

const ContractDetailModal = ({
  visible,
  onCancel,
  contract,
  attachments = [],
  onEdit,
  onDelete
}) => {
  if (!contract) return null;

  return (
    <Modal
      title="合同详情"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="edit" type="primary" onClick={onEdit}>编辑</Button>,
        <Button key="delete" danger onClick={onDelete}>删除</Button>,
        <Button key="close" onClick={onCancel}>关闭</Button>
      ]}
      width={1000}
      destroyOnClose
    >
      <div style={{ padding: '16px' }}>
        <Row gutter={24}>
          <Col span={12}>
            <Card size="small" title="基本信息" style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 12]}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>合同编号：</strong>
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                      {contract.ContractNumber || '-'}
                    </span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>状态：</strong>
                    <Tag color={contract.Status === 'active' ? 'green' : 'default'}>
                      {contract.Status || 'active'}
                    </Tag>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>合同标题：</strong>
                    <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      {contract.Title || '-'}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>合同描述：</strong>
                    <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                      {contract.Description || '无描述'}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="时间信息" style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 12]}>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>合同日期：</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>
                      {contract.ContractDate ? dayjs(contract.ContractDate).format('YYYY-MM-DD') : '未设置'}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>开始日期：</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>
                      {contract.StartDate ? dayjs(contract.StartDate).format('YYYY-MM-DD') : '未设置'}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>结束日期：</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>
                      {contract.EndDate ? dayjs(contract.EndDate).format('YYYY-MM-DD') : '未设置'}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Card size="small" title="附件信息">
              <AttachmentUpload
                relatedTable="Contract"
                relatedId={contract.Id || contract.id}
                attachments={attachments}
                onAttachmentsChange={() => {}}
                maxFileSize={10}
                multiple
                showDelete
                showDownload
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default ContractDetailModal;
