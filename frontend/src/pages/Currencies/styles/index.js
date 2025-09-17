// 币种表格样式
export const currencyTableStyles = `
  .currency-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .currency-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .currency-table .ant-table-tbody > tr:hover > td {
    background-color: #f6ffed !important;
  }
  
  .currency-table .ant-table-pagination {
    margin: 16px 0 !important;
  }
  
  .currency-table .ant-table-pagination .ant-pagination-item {
    border-radius: 4px !important;
  }
  
  .currency-table .ant-table-pagination .ant-pagination-item-active {
    border-color: #1890ff !important;
    background-color: #1890ff !important;
  }
  
  .currency-table .ant-table-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  /* 查询表单样式 */
  .search-form .ant-form-item-label {
    text-align: left !important;
    line-height: 32px !important;
    margin-bottom: 4px !important;
  }
  
  .search-form .ant-form-item-label > label {
    height: 32px !important;
    line-height: 32px !important;
    font-weight: 500 !important;
    color: #333 !important;
  }
  
  .search-form .ant-form-item-control {
    line-height: 32px !important;
  }
  
  .search-form .ant-form-item {
    margin-bottom: 16px !important;
  }
  
  .search-form .ant-select,
  .search-form .ant-input {
    width: 100% !important;
  }
  
  /* 币种特定样式 */
  .currency-code {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #1890ff;
  }
  
  .currency-symbol {
    font-weight: 600;
    color: #52c41a;
  }
  
  .exchange-rate {
    font-family: 'Courier New', monospace;
    color: #722ed1;
  }
  
  .status-active {
    color: #52c41a;
  }
  
  .status-inactive {
    color: #ff4d4f;
  }
  
  /* 模态框样式 */
  .currency-modal .ant-form-item-label > label {
    font-weight: 500;
  }
  
  .currency-modal .ant-input-group-addon {
    min-width: 80px;
    text-align: center;
  }
`;
