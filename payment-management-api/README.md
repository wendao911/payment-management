# Payment Management Backend API

## 功能特性

### 付款记录管理
- 创建、查询、更新、删除付款记录
- 支持多种搜索条件（付款编号、应付管理、供应商、合同、日期范围等）
- 分页查询
- 附件管理
- **新增：导出Excel功能**
  - 使用ExcelJS库生成标准Excel文件
  - 支持按搜索条件过滤导出
  - Excel结构与前端表格完全一致
  - 自动设置列宽和表头样式
  - 支持中文列名和数据

### API端点

#### 付款记录
- `GET /api/payment-records` - 获取付款记录列表（支持分页和搜索）
- `GET /api/payment-records/:id` - 获取单个付款记录详情
- `POST /api/payment-records` - 创建付款记录
- `PUT /api/payment-records/:id` - 更新付款记录
- `DELETE /api/payment-records/:id` - 删除付款记录
- `GET /api/payment-records/export/excel` - **新增：导出Excel文件**

#### 导出Excel参数
支持与查询API相同的搜索参数：
- `paymentNumber` - 付款编号（模糊搜索）
- `payableManagementId` - 应付管理ID
- `supplierId` - 供应商ID
- `contractId` - 合同ID
- `startDate` - 开始日期（YYYY-MM-DD）
- `endDate` - 结束日期（YYYY-MM-DD）

## 技术栈
- Node.js
- Express.js
- MySQL2
- ExcelJS（新增）
- JWT认证
- Multer文件上传

## 环境要求
- Node.js 16+
- MySQL 8.0+

## 安装和运行
```bash
npm install
npm start
```

## 环境变量
创建 `.env` 文件：
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_jwt_secret
PORT=5000
```
