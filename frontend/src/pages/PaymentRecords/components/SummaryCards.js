import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import dayjs from '../../../utils/dayjs';

const getExchangeRateToUSD = (currencyCode, currencies) => {
  if (!currencyCode) return 1;
  const upper = String(currencyCode).toUpperCase();
  if (upper === 'USD') return 1.0;
  if (upper === 'CNY' || upper === 'RMB') return 7.2;
  const cur = currencies.find(c => (c.Code || '').toUpperCase() === upper);
  const rate = cur?.ExchangeRate ?? cur?.exchangeRate;
  return rate && rate > 0 ? rate : 1.0;
};

const convertToUSD = (amount, currencyCode, currencies) => {
  const numeric = Number(amount || 0);
  const rate = getExchangeRateToUSD(currencyCode, currencies);
  return rate > 0 ? numeric / rate : numeric;
};

const SummaryCards = ({ paymentRecords = [], currencies = [] }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card size="small" hoverable>
          <Statistic
            title="总付款记录数"
            value={paymentRecords.length}
            valueStyle={{ color: '#3f8600' }}
            precision={0}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card size="small" hoverable>
          <Statistic
            title="本月付款"
            value={paymentRecords.filter(record => {
              const recordDate = dayjs(record.PaymentDate || record.paymentDate);
              const now = dayjs();
              return recordDate.isValid() && 
                     recordDate.month() === now.month() &&
                     recordDate.year() === now.year();
            }).length}
            valueStyle={{ color: '#1890ff' }}
            precision={0}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card size="small" hoverable>
          <Statistic
            title="总付款金额(USD)"
            value={paymentRecords.reduce((sum, r) => sum + convertToUSD(r.PaymentAmount || r.paymentAmount, r.CurrencyCode || r.currencyCode, currencies), 0).toFixed(2)}
            valueStyle={{ color: '#722ed1' }}
            prefix="$"
            precision={2}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card size="small" hoverable>
          <Statistic
            title="涉及应付数"
            value={(() => {
              // 获取所有不重复的应付管理ID
              const payableIds = paymentRecords
                .map(record => record.PayableManagementId || record.payableManagementId)
                .filter(id => id != null && id !== undefined);
              
              const uniqueIds = new Set(payableIds);
              
              return uniqueIds.size;
            })()}
            valueStyle={{ color: '#fa8c16' }}
            precision={0}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;
