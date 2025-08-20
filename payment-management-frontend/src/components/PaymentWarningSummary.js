import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Button, Space } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { apiClient } from '../utils/api';

const PaymentWarningSummary = ({ onViewDetails }) => {
  const [summary, setSummary] = useState({
    upcoming: 0,
    overdue: 0,
    important: 0,
    totalPayable: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWarningSummary();
  }, []);

  const fetchWarningSummary = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dashboard/payment-warnings-summary');
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('获取付款预警统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalWarnings = () => {
    return summary.upcoming + summary.overdue + summary.important;
  };

  const getSeverityLevel = () => {
    if (summary.overdue > 0) return 'error';
    if (summary.upcoming > 0) return 'warning';
    return 'info';
  };

  const getSeverityMessage = () => {
    let messages = [];
    
    if (summary.overdue > 0) {
      messages.push(`您有 ${summary.overdue} 个逾期付款需要立即处理`);
    }
    if (summary.upcoming > 0) {
      messages.push(`您有 ${summary.upcoming} 个付款7天内到期`);
    }
    if (summary.important > 0) {
      messages.push(`您有 ${summary.important} 个重要付款需要关注`);
    }
    
    if (messages.length === 0) {
      return '暂无付款预警';
    }
    
    return messages.join('；');
  };

  return (
    <div className="mb-6">
      {/* 预警提示 */}
      {getTotalWarnings() > 0 && (
        <Alert
          message="付款预警提醒"
          description={getSeverityMessage()}
          type={getSeverityLevel()}
          showIcon
          className="mb-4"
          action={
            <Button 
              size="small" 
              type="link" 
              onClick={() => onViewDetails && onViewDetails('all')}
            >
              查看详情
            </Button>
          }
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="7天内到期"
              value={summary.upcoming}
              valueStyle={{ 
                color: summary.upcoming > 0 ? '#faad14' : '#52c41a' 
              }}
              prefix={<ClockCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="逾期付款"
              value={summary.overdue}
              valueStyle={{ 
                color: summary.overdue > 0 ? '#ff4d4f' : '#52c41a' 
              }}
              prefix={<ExclamationCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="重要付款"
              value={summary.important}
              valueStyle={{ 
                color: summary.important > 0 ? '#1890ff' : '#52c41a' 
              }}
              prefix={<WarningOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="总应付金额"
              value={summary.totalPayable}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作按钮 */}
      {getTotalWarnings() > 0 && (
        <div className="mt-4 text-center">
          <Space>
            <Button 
              type="primary" 
              danger={summary.overdue > 0}
              onClick={() => onViewDetails && onViewDetails('overdue')}
            >
              查看逾期付款 ({summary.overdue})
            </Button>
            <Button 
              type="primary" 
              onClick={() => onViewDetails && onViewDetails('upcoming')}
            >
              查看即将到期 ({summary.upcoming})
            </Button>
            <Button 
              type="default" 
              onClick={() => onViewDetails && onViewDetails('important')}
            >
              查看重要付款 ({summary.important})
            </Button>

          </Space>
        </div>
      )}
    </div>
  );
};

export default PaymentWarningSummary;
