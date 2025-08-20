// Dashboard 样式
export const dashboardStyles = `
  .dashboard-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    border: 1px solid #f0f0f0;
  }
  
  .dashboard-card .ant-card-head {
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
    border-bottom: 1px solid #d9d9d9;
  }
  
  .dashboard-card .ant-card-head-title {
    font-weight: 600;
    color: #1890ff;
  }
  
  .dashboard-card .ant-card-extra {
    color: #666;
    font-size: 13px;
  }
  
  .dashboard-table .ant-table-thead > tr > th {
    background-color: #fafafa !important;
    color: #333 !important;
    font-weight: 500 !important;
    border-color: #e8e8e8 !important;
  }
  
  .dashboard-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .dashboard-table .ant-table-tbody > tr:hover > td {
    background-color: #f6ffed !important;
  }
  
  .dashboard-table .ant-table-pagination {
    margin: 16px 0 !important;
  }
  
  .dashboard-table .ant-table-pagination .ant-pagination-item {
    border-radius: 4px !important;
  }
  
  .dashboard-table .ant-table-pagination .ant-pagination-item-active {
    border-color: #1890ff !important;
    background-color: #1890ff !important;
  }
  
  .dashboard-table .ant-table-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  /* 银行账户进度条样式 */
  .dashboard-card .ant-progress-bg {
    background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  }
  
  /* 统计数字样式 */
  .dashboard-card .ant-statistic-title {
    color: #666;
    font-size: 14px;
  }
  
  .dashboard-card .ant-statistic-content {
    color: #1890ff;
    font-size: 24px;
    font-weight: 600;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .dashboard-card .ant-card-extra {
      display: none;
    }
    
    .dashboard-table {
      font-size: 12px;
    }
    
    .dashboard-table .ant-table-thead > tr > th,
    .dashboard-table .ant-table-tbody > tr > td {
      padding: 8px 4px !important;
    }
  }
  
  /* 加载状态样式 */
  .dashboard-card .ant-spin-container {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 空状态样式 */
  .dashboard-card .ant-empty {
    padding: 40px 0;
  }
  
  /* 标题样式 */
  .dashboard-card h1.ant-typography {
    color: #1890ff;
    margin-bottom: 24px;
    font-weight: 600;
  }
  
  .dashboard-card h5.ant-typography {
    color: #333;
    margin-bottom: 16px;
    font-weight: 500;
  }
  
  /* 分割线样式 */
  .ant-divider {
    margin: 24px 0 !important;
    border-color: #e8e8e8 !important;
  }
  
  /* 行间距样式 */
  .mb-6 {
    margin-bottom: 24px !important;
  }
  
  /* 字体样式 */
  .text-2xl {
    font-size: 24px !important;
  }
  
  .font-bold {
    font-weight: 600 !important;
  }
`;
