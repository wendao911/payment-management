import React from 'react';
import { Modal, Descriptions, Tag, Space, Button } from 'antd';
import dayjs from 'dayjs';
import AttachmentUpload from '../../components/common/AttachmentUpload';

const ContractDetailModal = ({ visible, onCancel, contract, attachments = [], onEdit, onDelete }) => {
  const title = contract ? `${contract.ContractNumber} - ${contract.Title || '合同详情'}` : '合同详情';

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={820}
      destroyOnClose
    >
      {contract && (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="合同编号">{contract.ContractNumber}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={contract.Status === 'active' ? 'green' : 'default'}>{contract.Status || 'active'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="合同标题">{contract.Title}</Descriptions.Item>
            <Descriptions.Item label="供应商">{contract.SupplierName}</Descriptions.Item>
            <Descriptions.Item label="签订日期">{contract.ContractDate ? dayjs(contract.ContractDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{contract.StartDate ? dayjs(contract.StartDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{contract.EndDate ? dayjs(contract.EndDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            <Descriptions.Item label="父合同">{contract.ParentContractId || '-'}</Descriptions.Item>
            <Descriptions.Item label="合同描述" span={2}>{contract.Description || '-'}</Descriptions.Item>
          </Descriptions>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button type="primary" onClick={onEdit}>编辑</Button>
              <Button danger onClick={onDelete}>删除</Button>
            </Space>
          </div>

          <AttachmentUpload
            relatedTable="Contracts"
            relatedId={contract.Id}
            attachments={attachments}
            onAttachmentsChange={() => {}}
            multiple={false}
            disabled
            showDelete={false}
          />
        </>
      )}
    </Modal>
  );
};

export default ContractDetailModal;


