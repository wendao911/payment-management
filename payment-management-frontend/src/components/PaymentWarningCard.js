import React from 'react';
import { Card, Tag, Space, Button, Progress } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const PaymentWarningCard = ({ warning, onViewDetails }) => {
  const getWarningColor = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'red';
    if (daysUntilDue <= 10) return 'orange';
    if (daysUntilDue <= 20) return 'green';
    return 'blue';
  };

  const getWarningText = (daysUntilDue) => {
    if (daysUntilDue < 0) return '已逾期';
    if (daysUntilDue <= 10) return '紧急预警';
    if (daysUntilDue <= 20) return '即将到期';
    return '正常';
  };

  const getWarningIcon = (daysUntilDue) => {
    if (daysUntilDue < 0) return <ExclamationCircleOutlined />;
    if (daysUntilDue <= 10) return <ExclamationCircleOutlined />;
    if (daysUntilDue <= 20) return <ClockCircleOutlined />;
    return <ClockCircleOutlined />;
  };

  const daysUntilDue = warning.daysUntilDue;
  const warningColor = getWarningColor(daysUntilDue);
  const warningText = getWarningText(daysUntilDue);
  const warningIcon = getWarningIcon(daysUntilDue);

  // 计算付款进度
  const progressPercent = warning.totalAmount > 0 
    ? ((warning.totalAmount - warning.payableAmount) / warning.totalAmount) * 100 
    : 0;

  return (
    <Card
      size="small"
      className="mb-3"
      style={{ 
        borderLeft: `4px solid ${warningColor === 'red' ? '#ff4d4f' : 
                                  warningColor === 'orange' ? '#faad14' : 
                                  warningColor === 'green' ? '#52c41a' : '#1890ff'}` 
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Tag color={warningColor} icon={warningIcon}>
              {warningText}
            </Tag>
            <span className="ml-2 text-sm text-gray-500">
              {daysUntilDue < 0 ? `逾期 ${Math.abs(daysUntilDue)} 天` : `还有 ${daysUntilDue} 天到期`}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="font-medium">{warning.contractNumber}</div>
            <div className="text-sm text-gray-600">{warning.supplierName}</div>
          </div>

          <div className="mb-2">
            <Space size="large">
              <span className="text-sm">
                <DollarOutlined className="mr-1" />
                总金额: ¥{warning.totalAmount.toLocaleString()}
              </span>
              <span className="text-sm">
                已付: ¥{(warning.totalAmount - warning.payableAmount).toLocaleString()}
              </span>
              <span className="text-sm text-red-500">
                应付: ¥{warning.payableAmount.toLocaleString()}
              </span>
            </Space>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>付款进度</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={progressPercent} 
              size="small" 
              strokeColor={warningColor === 'red' ? '#ff4d4f' : 
                          warningColor === 'orange' ? '#faad14' : 
                          warningColor === 'green' ? '#52c41a' : '#1890ff'}
            />
          </div>

          <div className="text-xs text-gray-500">
            截止日期: {dayjs(warning.paymentDueDate).format('YYYY-MM-DD')}
          </div>
        </div>

        <div className="ml-4">
          <Button 
            type="link" 
            size="small"
            onClick={() => onViewDetails(warning)}
          >
            查看详情
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PaymentWarningCard;
