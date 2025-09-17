import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Card, Table, Tag, Button, Row, Col, Statistic } from 'antd';
import * as echarts from 'echarts';
import dayjs from '../../../utils/dayjs';
import { dashboardStyles } from '../styles';
import ResizeObserverFix from '../../../components/ResizeObserverFix';

// 使用 React.memo 包装组件，避免不必要的重新渲染
const PayablesSummary = React.memo(({ title, loading, dataSource, summary }) => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAllStats, setShowAllStats] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 使用 useMemo 缓存列定义，避免每次渲染都重新创建
  const columns = useMemo(() => [
    { 
      title: '状态', 
      dataIndex: 'warningStatus',
      width: 80,
      render: (status) => {
        if (status === 'urgent') {
          return <Tag color="orange">紧急</Tag>;
        } else if (status === 'overdue') {
          return <Tag color="red">逾期</Tag>;
        }
        return <Tag color="default">正常</Tag>;
      }
    },
    { title: '应付编号', dataIndex: 'payableNumber', width: 120 },
    { title: '应付说明', dataIndex: 'payableDescription', width: 150, ellipsis: true },
    { title: '供应商', dataIndex: 'supplierName', width: 120, ellipsis: true },
    { title: '合同编号', dataIndex: 'contractDisplay', width: 200, ellipsis: true },
    { 
      title: '应付金额', 
      dataIndex: 'payableAmountDisplay',
      width: 120
    },
    { 
      title: '应付金额(USD)', 
      dataIndex: 'payableAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '已付金额(USD)', 
      dataIndex: 'totalPaidAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '剩余金额(USD)', 
      dataIndex: 'remainingAmountUsd', 
      width: 120,
      render: v => `$${Number(v || 0).toLocaleString()}` 
    },
    { 
      title: '到期日', 
      dataIndex: 'paymentDueDate',
      width: 100,
      render: (value) => {
        if (!value) return '-';
        // 直接使用数据库日期，不做时区处理
        return dayjs(value).format('YYYY-MM-DD');
      }
    },
  ], []);

  // 使用 useCallback 缓存行样式函数
  const getRowClassName = useCallback((record) => {
    if (record.warningStatus === 'urgent') return 'urgent-row';
    if (record.warningStatus === 'overdue') return 'overdue-row';
    return '';
  }, []);

  // 使用 useMemo 缓存统计摘要
  const summaryExtra = useMemo(() => {
    if (!summary) return null;
    return (
      <div style={{ fontSize: '12px', color: '#666' }}>
        紧急: {summary.urgent.count}项 (${summary.urgent.totalUsd.toLocaleString()}) | 
        逾期: {summary.overdue.count}项 (${summary.overdue.totalUsd.toLocaleString()})
      </div>
    );
  }, [summary]);

  // 计算饼图数据
  const pieChartData = useMemo(() => {
    
    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      return [
        { name: '已付金额', value: 0, color: '#1890ff' },
        { name: '剩余金额', value: 0, color: '#faad14' }
      ];
    }

    // 如果选中了特定记录，只显示该记录的数据
    if (selectedRecord) {
      const selectedData = [
        { name: '已付金额', value: selectedRecord.totalPaidAmountUsd || 0, color: '#1890ff' },
        { name: '剩余金额', value: selectedRecord.remainingAmountUsd || 0, color: '#faad14' }
      ];
      return selectedData;
    }

    // 显示全部数据
    const totalPaid = dataSource.reduce((sum, item) => sum + (Number(item.totalPaidAmountUsd) || 0), 0);
    const totalRemaining = dataSource.reduce((sum, item) => sum + (Number(item.remainingAmountUsd) || 0), 0);

    const result = [
      { name: '已付金额', value: totalPaid, color: '#1890ff' },
      { name: '剩余金额', value: totalRemaining, color: '#faad14' }
    ];
    
    return result;
  }, [dataSource, selectedRecord]);

  // 计算总金额
  const totalAmount = useMemo(() => {
    if (!Array.isArray(dataSource) || dataSource.length === 0) return 0;
    
    if (selectedRecord) {
      return selectedRecord.payableAmountUsd || 0;
    }
    
    return dataSource.reduce((sum, item) => sum + (item.payableAmountUsd || 0), 0);
  }, [dataSource, selectedRecord]);

  // 计算已付和剩余金额
  const totalPaidAmount = useMemo(() => {
    if (!Array.isArray(dataSource) || dataSource.length === 0) return 0;
    
    if (selectedRecord) {
      return selectedRecord.totalPaidAmountUsd || 0;
    }
    
    return dataSource.reduce((sum, item) => sum + (item.totalPaidAmountUsd || 0), 0);
  }, [dataSource, selectedRecord]);

  const totalRemainingAmount = useMemo(() => {
    if (!Array.isArray(dataSource) || dataSource.length === 0) return 0;
    
    if (selectedRecord) {
      return selectedRecord.remainingAmountUsd || 0;
    }
    
    return dataSource.reduce((sum, item) => sum + (item.remainingAmountUsd || 0), 0);
  }, [dataSource, selectedRecord]);

  // 处理行点击
  const handleRowClick = useCallback((record) => {
    setSelectedRecord(record);
    setShowAllStats(false);
  }, []);

  // 查看全部统计
  const handleViewAllStats = useCallback(() => {
    setSelectedRecord(null);
    setShowAllStats(true);
  }, []);

  // 初始化图表
  useEffect(() => {
    const initChart = () => {
      if (chartRef.current && !chartInstance.current) {
        try {
          // 确保容器有尺寸
          if (chartRef.current.offsetWidth > 0 && chartRef.current.offsetHeight > 0) {
            chartInstance.current = echarts.init(chartRef.current);
            
            // 只有在有数据时才设置图表
            if (pieChartData && pieChartData.length > 0 && pieChartData.some(item => item.value > 0)) {
              updateChart();
            }
          } else {
            setTimeout(initChart, 100);
          }
        } catch (error) {
          console.warn('图表初始化失败:', error);
        }
      }
    };

    // 延迟初始化，确保DOM已经渲染
    const timer = setTimeout(initChart, 300);
    
    return () => {
      clearTimeout(timer);
      if (chartInstance.current) {
        try {
          chartInstance.current.dispose();
        } catch (error) {
          console.warn('图表销毁失败:', error);
        }
        chartInstance.current = null;
      }
    };
  }, [pieChartData]); // 添加 pieChartData 依赖

  // 更新图表的函数
  const updateChart = useCallback(() => {
    // 检查是否有有效数据
    if (!pieChartData || pieChartData.length === 0 || !pieChartData.some(item => item.value > 0)) {
      return; // 没有有效数据，不更新图表
    }
    
    if (chartInstance.current) {
      try {
        // 先清空图表
        chartInstance.current.clear();
        
        const option = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            formatter: function(params) {
              return `${params.name}: $${Number(params.value).toLocaleString()}`;
            }
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            textStyle: {
              color: '#333'
            }
          },
          series: [
            {
              name: '金额统计',
              type: 'pie',
              radius: ['35%', '75%'],
              center: ['50%', '50%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: true,
                position: 'outside',
                formatter: '{b}: ${c}',
                fontSize: 12,
                color: '#333'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '14',
                  fontWeight: 'bold'
                },
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              labelLine: {
                show: true,
                length: 15,
                length2: 15
              },
              data: pieChartData.map(item => ({
                name: item.name,
                value: item.value,
                itemStyle: { color: item.color }
              }))
            }
          ]
        };
        
        // 使用 notMerge: true 强制重新渲染
        chartInstance.current.setOption(option, true, true);
        
        // 检查图表状态并强制重绘
        setTimeout(() => {
          if (chartInstance.current) {
            chartInstance.current.resize();
          }
        }, 100);
        
      } catch (error) {
        console.error('更新图表失败:', error);
      }
    }
  }, [pieChartData]);

  // 强制重新渲染图表的函数
  const forceChartUpdate = useCallback(() => {
    if (chartRef.current && chartInstance.current) {
      try {
        chartInstance.current.resize();
        updateChart();
      } catch (error) {
        console.error('强制更新图表失败:', error);
      }
    }
  }, [updateChart]);

  // 监听窗口大小变化，重新渲染图表
  useEffect(() => {
    const handleResize = () => {
      setTimeout(forceChartUpdate, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forceChartUpdate]);

  // 当数据变化时，确保图表更新
  useEffect(() => {
    if (!loading && pieChartData && pieChartData.length > 0 && pieChartData.some(item => item.value > 0)) {
      // 确保图表实例存在
      if (chartInstance.current) {
        updateChart();
      } else {
        // 如果图表实例不存在，延迟初始化
        setTimeout(() => {
          if (chartRef.current && !chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
            updateChart();
          }
        }, 100);
      }
    }
  }, [pieChartData, loading, updateChart]);

  // 监听 dataSource 变化，强制更新图表
  useEffect(() => {
    if (dataSource && dataSource.length > 0) {
      // 延迟更新，确保数据计算完成
      setTimeout(() => {
        if (chartInstance.current) {
          updateChart();
        }
      }, 200);
    }
  }, [dataSource, updateChart]);

  // 确保数据源是有效的数组
  const validDataSource = Array.isArray(dataSource) ? dataSource.map((item, index) => ({
    ...item,
    // 确保每条记录都有唯一的key
    key: item.id || item.Id || `payable-${index}`,
    // 如果原始数据没有id字段，使用索引作为备用
    id: item.id || item.Id || `payable-${index}`
  })) : [];

  return (
    <ResizeObserverFix>
      <style>{dashboardStyles}</style>
      <Card 
        title={title} 
        loading={loading} 
        className="dashboard-card"
        extra={summaryExtra}
      >
        {/* 饼图统计区域 */}
        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <div style={{ height: 300, position: 'relative' }}>
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  加载中...
                </div>
              ) : !validDataSource || validDataSource.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  暂无数据
                </div>
              ) : (
                <div 
                  ref={chartRef} 
                  style={{ width: '100%', height: '100%' }}
                />
              )}
              
              {/* 中心显示总金额 - 只在有数据时显示 */}
              {!loading && validDataSource && validDataSource.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                    {selectedRecord ? '选中记录' : (showAllStats ? '全部统计' : '当前统计')}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    ${Number(totalAmount).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ padding: '20px 0' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="应付总额"
                    value={selectedRecord ? selectedRecord.payableAmountUsd : totalAmount}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="已付金额"
                    value={selectedRecord ? selectedRecord.totalPaidAmountUsd : totalPaidAmount}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="剩余金额"
                    value={selectedRecord ? selectedRecord.remainingAmountUsd : totalRemainingAmount}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="付款进度"
                    value={totalAmount > 0 ? ((totalPaidAmount / totalAmount) * 100) : 0}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
              
              {/* 操作按钮 */}
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={handleViewAllStats}
                  style={{ marginRight: '8px' }}
                >
                  查看全部统计
                </Button>
                {selectedRecord && (
                  <Button 
                    size="small"
                    onClick={() => setSelectedRecord(null)}
                    style={{ marginRight: '8px' }}
                  >
                    取消选择
                  </Button>
                )}
                <Button 
                  size="small"
                  onClick={forceChartUpdate}
                  style={{ marginRight: '8px' }}
                >
                  刷新图表
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* 表格区域 */}
        <Table
          size="small"
          rowKey="key"
          pagination={{ pageSize: 10 }}
          dataSource={validDataSource}
          columns={columns}
          className="dashboard-table"
          scroll={{ x: 'max-content' }}
          rowClassName={getRowClassName}
          bordered={false}
          showHeader={true}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>
    </ResizeObserverFix>
  );
});

// 设置显示名称，便于调试
PayablesSummary.displayName = 'PayablesSummary';

export default PayablesSummary;
