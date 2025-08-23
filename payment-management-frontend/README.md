# Payment Management Frontend

## 功能特性

### 付款记录管理
- 查看付款记录列表
- 搜索和筛选付款记录
- 查看付款记录详情
- **新增：导出Excel功能**
  - 支持按当前搜索条件导出
  - Excel结构与表格显示完全一致
  - 包含所有重要字段：付款编号、应付编号、应付说明、合同信息、供应商、付款说明、付款金额、币种、USD金额、付款日期、备注等
  - 自动格式化日期和金额
  - 支持中文文件名

### 导出Excel使用说明
1. 在付款记录页面设置搜索条件（可选）
2. 点击"导出Excel"按钮
3. 系统将根据当前搜索条件导出数据
4. 文件将自动下载到本地，文件名格式：`付款记录_YYYY-MM-DD.xlsx`

## 技术栈
- React 17
- Ant Design 5
- Tailwind CSS
- Axios
- Day.js

## 开发环境设置
```bash
npm install
npm start
```

## 构建
```bash
npm run build
```
