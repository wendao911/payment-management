import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Row,
  Col,
  Card,
  Tag,
  Button,
  Space,
  message,
  Avatar,
  Divider
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import AttachmentUpload from '../../../components/common/AttachmentUpload';
import { apiClient } from '../../../utils/api';

const { TabPane } = Tabs;

const PayableDetailModal = ({
  visible,
  onCancel,
  currentPayable,
  onEdit,
  onDelete,
  onViewPaymentRecord,
  onEditPaymentRecord,
  onDeletePaymentRecord,
  onAddPaymentRecord,
  onRefresh
}) => {
  const [localAttachments, setLocalAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 当模态框打开或数据变化时，更新本地附件状态
  useEffect(() => {
    if (visible && currentPayable) {
      setLocalAttachments(currentPayable.attachments || []);
    }
  }, [visible, currentPayable]);

  // 处理附件变化
  const handleAttachmentsChange = async (attachments) => {
    try {
      setLocalAttachments(attachments);

      // 通知父组件刷新数据
      if (onRefresh) {
        await onRefresh();
      }

      message.success('附件更新成功');
    } catch (error) {
      console.error('附件更新失败:', error);
      message.error('附件更新失败');
    }
  };

  // 刷新附件数据
  const refreshAttachments = async () => {
    if (!currentPayable?.Id) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/attachment/payable/${currentPayable.Id}`);
      if (response.success) {
        setLocalAttachments(response.data || []);
      }
    } catch (error) {
      console.error('刷新附件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentPayable) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'partial': return 'processing';
      case 'completed': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待付款';
      case 'partial': return '部分付款';
      case 'completed': return '已完成';
      case 'overdue': return '逾期';
      default: return '未知';
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'normal': return 'default';
      case 'important': return 'processing';
      case 'very_important': return 'error';
      default: return 'default';
    }
  };

  const getImportanceText = (importance) => {
    switch (importance) {
      case 'normal': return '一般';
      case 'important': return '重要';
      case 'very_important': return '非常重要';
      default: return '未知';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'normal': return 'default';
      case 'urgent': return 'processing';
      case 'very_urgent': return 'error';
      case 'overdue': return 'red';
      default: return 'default';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'normal': return '一般';
      case 'urgent': return '紧急';
      case 'very_urgent': return '非常紧急';
      case 'overdue': return '已延期';
      default: return '未知';
    }
  };

  return (
    <Modal
      title="应付详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
      className="payable-detail-modal"
      destroyOnClose
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>应付编号：</strong>{currentPayable.PayableNumber}</p>
              <p><strong>应付说明：</strong>{currentPayable.Description}</p>
              <p><strong>合同：</strong>{
                (() => {
                  const number = currentPayable.ContractNumber || '';
                  const title = currentPayable.ContractTitle || currentPayable.Title || '';
                  if (number && title) return `${number} - ${title}`;
                  return number || title || '无';
                })()
              }</p>
              <p><strong>供应商：</strong>{currentPayable.SupplierName || '未知供应商'}</p>
              <p><strong>状态：</strong>
                <Tag color={getStatusColor(currentPayable.Status)}>
                  {getStatusText(currentPayable.Status)}
                </Tag>
              </p>
            </Col>
            <Col span={12}>
              <p><strong>应付金额：</strong>
                <span style={{ fontWeight: 'bold' }}>
                  {currentPayable.CurrencySymbol || ''}{parseFloat(currentPayable.PayableAmount || 0).toFixed(2)}
                </span>
              </p>
              <p><strong>币种：</strong>{currentPayable.CurrencyName}</p>
              <p><strong>美元等值：</strong>
                <span style={{ fontWeight: 'bold' }}>
                  ${parseFloat(currentPayable.PayableAmountUSD || 0).toFixed(2)}
                </span>
              </p>
              <p><strong>付款截止日期：</strong>{dayjs(currentPayable.PaymentDueDate).format('YYYY-MM-DD')}</p>
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>重要程度：</strong>
                <Tag color={getImportanceColor(currentPayable.Importance)}>
                  {getImportanceText(currentPayable.Importance)}
                </Tag>
              </p>
            </Col>
            <Col span={12}>
              <p><strong>紧急程度：</strong>
                <Tag color={getUrgencyColor(currentPayable.Urgency)}>
                  {getUrgencyText(currentPayable.Urgency)}
                </Tag>
              </p>
            </Col>
          </Row>
          {(currentPayable.Notes || currentPayable.notes) && (
            <>
              <Divider />
              <p><strong>备注：</strong></p>
              <p>{currentPayable.Notes || currentPayable.notes}</p>
            </>
          )}
        </TabPane>

        <TabPane tab="付款记录" key="2">
          {/* 付款记录统计信息 */}
          {currentPayable.paymentRecords && currentPayable.paymentRecords.length > 0 && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>总记录数</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {currentPayable.paymentRecords.length}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>已付总额</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    ${currentPayable.paymentRecords.reduce((sum, item) =>
                      sum + (parseFloat(item.PaymentAmountUSD || 0)), 0
                    ).toFixed(2)}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>剩余金额</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cf1322' }}>
                    ${(parseFloat(currentPayable.PayableAmountUSD || 0) -
                      currentPayable.paymentRecords.reduce((sum, item) =>
                        sum + (parseFloat(item.PaymentAmountUSD || 0)), 0
                      )).toFixed(2)}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>完成进度</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                    {Math.round(
                      (currentPayable.paymentRecords.reduce((sum, item) =>
                        sum + (parseFloat(item.PaymentAmountUSD || item.PaymentAmountUSD || 0)), 0
                      ) / parseFloat(currentPayable.PayableAmountUSD || 1)) * 100
                    )}%
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onAddPaymentRecord(currentPayable.Id || currentPayable.id)}
            >
              新增付款记录
            </Button>
          </div>

          {currentPayable.paymentRecords && currentPayable.paymentRecords.length > 0 ? (
            <div>
              {currentPayable.paymentRecords.map((item, index) => (
                <Card
                  key={item.Id || item.id || index}
                  size="small"
                  style={{ marginBottom: 12 }}
                  bodyStyle={{ padding: '12px' }}
                  className="payment-record-card"
                >
                  <Row gutter={16} align="middle">
                    <Col span={14}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar
                          icon={<DollarOutlined />}
                          style={{ backgroundColor: '#52c41a' }}
                        />
                        <div>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#1890ff',
                            marginBottom: '4px'
                          }}>
                            {item.PaymentNumber || item.paymentNumber || `付款记录-${index + 1}`}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: '4px'
                          }}>
                            {item.PaymentDescription || item.paymentDescription || '无说明'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            付款日期：{dayjs(item.PaymentDate || item.paymentDate).format('YYYY-MM-DD')} |
                            备注：{item.Notes || item.notes || '无'}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#52c41a',
                        fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                      }}>
                        {(item.CurrencySymbol || '')}
                        {(item.PaymentAmount || item.paymentAmount || 0).toLocaleString('zh-CN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {item.CurrencyCode || item.currencyCode || 'USD'}
                      </div>
                    </Col>
                    <Col span={4} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1890ff',
                        fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                      }}>
                        ${parseFloat(item.PaymentAmountUSD || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        美元等值
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                      <Space size="small">
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => onViewPaymentRecord(item)}
                        >
                          详情
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => onEditPaymentRecord(item)}
                        >
                          编辑
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => onDeletePaymentRecord(item)}
                        >
                          删除
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '40px',
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无付款记录</div>
              <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                点击"新增付款记录"按钮创建第一条付款记录
              </div>
            </div>
          )}
        </TabPane>

        <TabPane tab="附件" key="3">
          <AttachmentUpload
            relatedTable="PayableManagement"
            relatedId={currentPayable.Id || currentPayable.id}
            attachments={localAttachments}
            onAttachmentsChange={handleAttachmentsChange}
            maxFileSize={10}
            multiple={true}
            showDelete={true}
            showDownload={true}
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default PayableDetailModal;
