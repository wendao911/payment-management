import React from 'react';
import { Card, Spin, Empty, Space, Typography } from 'antd';
import { dashboardStyles } from '../styles';

const { Text } = Typography;

const BankAccountsSummary = ({ loading, bankSummary, maxBankTotalUsd }) => {
  return (
    <>
      <style>{dashboardStyles}</style>
      <Card 
        title="银行账户（统一美元）" 
        extra={
          <span>
            总余额：${bankSummary.aggregate.totalUsd?.toLocaleString?.() || 0}，
            可用：${bankSummary.aggregate.availableUsd?.toLocaleString?.() || 0}，
            不可用：${bankSummary.aggregate.unavailableUsd?.toLocaleString?.() || 0}
          </span>
        }
        className="dashboard-card"
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : bankSummary.items.length === 0 ? (
          <Empty description="暂无账户" />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {bankSummary.items.map(item => {
              const widthScale = Math.max(0.1, Number(item.totalUsd || 0) / maxBankTotalUsd);
              const availablePct = item.totalUsd > 0 ? (Number(item.availableUsd || 0) / Number(item.totalUsd || 1)) : 0;
              const unavailablePct = 1 - availablePct;
              return (
                <div key={item.accountId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Space size={8}>
                      <Text strong>{item.accountName}</Text>
                      <Text type="secondary">{item.bankName}</Text>
                      <Text type="secondary">{item.currencyCode}</Text>
                    </Space>
                    <Space size={16}>
                      <Text>总额 ${Number(item.totalUsd || 0).toLocaleString()}</Text>
                      <Text type="success">可用 ${Number(item.availableUsd || 0).toLocaleString()}</Text>
                      <Text type="secondary">不可用 ${Number(item.unavailableUsd || 0).toLocaleString()}</Text>
                    </Space>
                  </div>
                  <div style={{ width: `${Math.min(100, widthScale * 100)}%`, height: 14, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${availablePct * 100}%`, height: '100%', background: '#52c41a', display: 'inline-block' }} />
                    <div style={{ width: `${unavailablePct * 100}%`, height: '100%', background: '#bfbfbf', display: 'inline-block' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};

export default BankAccountsSummary;
