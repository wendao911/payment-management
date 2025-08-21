import React, { useState, useEffect } from 'react';
import {
  Modal,
  Row,
  Col,
  Card,
  Tag,
  Button,
  Space,
  message
} from 'antd';
import {
  EditOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import AttachmentUpload from '../../../components/common/AttachmentUpload';
import { apiClient } from '../../../utils/api';

const PaymentRecordDetailModal = ({
  visible,
  onCancel,
  viewingPaymentRecord,
  onEdit,
  onRefresh,
  currencies = []
}) => {
  const [localAttachments, setLocalAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 当模态框打开或数据变化时，更新本地附件状态
  useEffect(() => {
    if (visible && viewingPaymentRecord) {
      setLocalAttachments(viewingPaymentRecord.attachments || []);
    }
  }, [visible, viewingPaymentRecord]);

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
    if (!viewingPaymentRecord?.Id) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/attachment/payment/${viewingPaymentRecord.Id}`);
      if (response.success) {
        setLocalAttachments(response.data || []);
      }
    } catch (error) {
      console.error('刷新附件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加调试信息
  console.log('PaymentRecordDetailModal - viewingPaymentRecord:', viewingPaymentRecord);
  console.log('PaymentRecordDetailModal - attachments:', viewingPaymentRecord?.attachments);
  
  if (!viewingPaymentRecord) return null;

  // 以美元为基准的汇率获取（USD=1.00，CNY=7.20）
  const getExchangeRateToUSD = (currencyCode) => {
    if (!currencyCode) return 1;
    const upper = String(currencyCode).toUpperCase();
    if (upper === 'USD') return 1.0;
    if (upper === 'CNY' || upper === 'RMB') return 7.2;
    const cur = currencies.find(c => (c.Code || '').toUpperCase() === upper);
    const rate = cur?.ExchangeRate ?? cur?.exchangeRate;
    return rate && rate > 0 ? rate : 1.0;
  };

  const convertToUSD = (amount, currencyCode) => {
    const numeric = Number(amount || 0);
    const rate = getExchangeRateToUSD(currencyCode);
    if (!rate || rate <= 0) return numeric;
    // rate表示 1 USD = rate [currencyCode]
    // 因此 某币种金额 -> USD = 金额 / rate
    return numeric / rate;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>付款记录详情</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => onEdit(viewingPaymentRecord)}
        >
          编辑记录
        </Button>
      ]}
      width={1200}
      destroyOnClose
    >
      <div style={{ padding: '16px' }}>
        <Row gutter={24}>
          <Col span={12}>
            <Card size="small" title="基本信息" style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 12]}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>付款编号：</strong>
                    <span style={{
                      color: '#1890ff',
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      {viewingPaymentRecord.PaymentNumber || viewingPaymentRecord.paymentNumber || '-'}
                    </span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>币种：</strong>
                    <Tag color="blue" style={{ fontWeight: 'bold' }}>
                      {viewingPaymentRecord.CurrencyCode || viewingPaymentRecord.currencyCode || '-'}
                    </Tag>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>付款说明：</strong>
                    <div style={{
                      marginTop: '4px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9'
                    }}>
                      {viewingPaymentRecord.PaymentDescription || viewingPaymentRecord.paymentDescription || '-'}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="金额信息" style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 12]}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>付款金额：</strong>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#52c41a'
                    }}>
                      {(viewingPaymentRecord.CurrencySymbol || '')}
                      {(viewingPaymentRecord.PaymentAmount || viewingPaymentRecord.paymentAmount || 0).toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>美元等值：</strong>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1890ff'
                    }}>
                      ${convertToUSD(
                        viewingPaymentRecord.PaymentAmount || viewingPaymentRecord.paymentAmount,
                        viewingPaymentRecord.CurrencyCode || viewingPaymentRecord.currencyCode
                      ).toFixed(2)}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>付款日期：</strong>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {dayjs(viewingPaymentRecord.PaymentDate || viewingPaymentRecord.paymentDate).format('YYYY年MM月DD日')}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Card size="small" title="备注信息" style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                minHeight: '60px'
              }}>
                {viewingPaymentRecord.Notes || viewingPaymentRecord.notes ? (
                  <span style={{ color: '#333', lineHeight: '1.6' }}>
                    {viewingPaymentRecord.Notes || viewingPaymentRecord.notes}
                  </span>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>
                    暂无备注信息
                  </span>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Card size="small" title="时间信息">
              <Row gutter={[8, 12]}>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#666' }}>创建时间：</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>
                      {dayjs(viewingPaymentRecord.CreatedAt || viewingPaymentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                </Col>
                {viewingPaymentRecord.UpdatedAt && (
                  <Col span={24}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#666' }}>更新时间：</strong>
                      <div style={{ marginTop: '4px', color: '#333' }}>
                        {dayjs(viewingPaymentRecord.UpdatedAt).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="附件信息">
              <AttachmentUpload
                relatedTable="PaymentRecords"
                relatedId={viewingPaymentRecord.Id || viewingPaymentRecord.id}
                attachments={localAttachments}
                onAttachmentsChange={handleAttachmentsChange}
                maxFileSize={10}
                multiple={true}
                showDelete={true}
                showDownload={true}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default PaymentRecordDetailModal;
