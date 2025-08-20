// 供应商表格样式
export const supplierTableStyles = `
  .supplier-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .supplier-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .supplier-table .ant-table-tbody > tr:hover > td {
    background-color: #f6ffed !important;
  }
  
  .supplier-table .ant-table-pagination {
    margin: 16px 0 !important;
  }
  
  .supplier-table .ant-table-pagination .ant-pagination-item {
    border-radius: 4px !important;
  }
  
  .supplier-table .ant-table-pagination .ant-pagination-item-active {
    border-color: #1890ff !important;
    background-color: #1890ff !important;
  }
  
  .supplier-table .ant-table-pagination .ant-pagination-item-active a {
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
`;
