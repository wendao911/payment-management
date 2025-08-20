// 银行账户表格样式
export const bankAccountTableStyles = `
  .bank-account-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .bank-account-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .bank-account-table .ant-table-tbody > tr:hover > td {
    background-color: #f6ffed !important;
  }
  
  .bank-account-table .ant-table-pagination {
    margin: 16px 0 !important;
  }
  
  .bank-account-table .ant-table-pagination .ant-pagination-item {
    border-radius: 4px !important;
  }
  
  .bank-account-table .ant-table-pagination .ant-pagination-item-active {
    border-color: #1890ff !important;
    background-color: #1890ff !important;
  }
  
  .bank-account-table .ant-table-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  .parent-account {
    background-color: #f0f8ff !important;
    font-weight: bold !important;
  }
  
  .child-balance {
    background-color: #fafafa !important;
    padding-left: 20px !important;
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

// 余额记录子表样式
export const balanceTableStyles = `
  .balance-sub-table .ant-table-thead > tr > th {
    background-color: #f0f8ff !important;
    color: #1890ff !important;
    font-weight: bold !important;
    border-color: #d9d9d9 !important;
  }
  
  .balance-sub-table .ant-table-tbody > tr > td {
    border-color: #f0f0f0 !important;
  }
  
  .balance-table-row:hover > td {
    background-color: #f6ffed !important;
  }
  
  .balance-sub-table .ant-table-thead > tr > th:first-child {
    border-top-left-radius: 6px;
  }
  
  .balance-sub-table .ant-table-thead > tr > th:last-child {
    border-top-right-radius: 6px;
  }
  
  /* 隐藏自动生成的子记录行 */
  .ant-table-tbody .ant-table-row-level-1 {
    display: none !important;
  }
  
  /* 隐藏展开行中的子记录行 */
  .ant-table-expanded-row .ant-table-row-level-1 {
    display: none !important;
  }
`;

// 树结构样式
export const treeTableStyles = {
  '.parent-account': {
    backgroundColor: '#f0f8ff',
    fontWeight: 'bold'
  },
  '.child-balance': {
    backgroundColor: '#fafafa',
    paddingLeft: '20px'
  }
};
