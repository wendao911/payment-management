# 应付管理系统后端API

基于Node.js和Express构建的应付管理系统后端API服务。

## 功能特性

- 🔐 JWT身份认证
- 📊 完整的CRUD操作
- 📁 文件上传和管理
- 🛡️ 安全防护（Helmet, CORS, Rate Limiting）
- 📝 请求日志记录
- 🔍 数据验证和错误处理
- 📈 统计分析和报表
- ⚠️ 付款预警系统

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL
- **认证**: JWT
- **文件上传**: Multer
- **验证**: Express-validator
- **安全**: Helmet, CORS
- **日志**: Morgan

## 项目结构

```
payment-management-api/
├── config/                 # 配置文件
│   └── database.js        # 数据库配置
├── middleware/            # 中间件
│   ├── auth.js           # JWT认证
│   └── upload.js         # 文件上传
├── routes/                # 路由文件
│   ├── suppliers.js      # 供应商管理
│   ├── contracts.js      # 合同管理
│   ├── payments.js       # 应付管理
│   ├── attachments.js    # 附件管理
│   ├── dashboard.js      # 仪表板
│   ├── countries.js      # 国家管理
│   ├── banks.js          # 银行管理
│   └── bankAccounts.js   # 银行账户管理
├── uploads/               # 文件上传目录
├── .env                   # 环境变量
├── package.json           # 项目依赖
├── server.js              # 主服务器文件
└── README.md              # 项目说明
```

## 安装和运行

### 1. 安装依赖

```bash
cd payment-management-api
npm install
```

### 2. 环境配置

复制环境变量文件并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=payment_management

# 服务器配置
PORT=5000
HOST=127.0.0.1
NODE_ENV=development

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# CORS配置
LOCAL_HOSTS=localhost,127.0.0.1
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API接口

### 认证

所有API接口都需要在请求头中包含JWT令牌：

```
Authorization: Bearer <your_jwt_token>
```

### 供应商管理

- `GET /api/supplier` - 获取供应商列表
- `GET /api/supplier/:id` - 获取供应商详情
- `POST /api/supplier` - 创建供应商
- `PUT /api/supplier/:id` - 更新供应商
- `DELETE /api/supplier/:id` - 删除供应商
- `GET /api/supplier/search/:keyword` - 搜索供应商

### 合同管理

- `GET /api/contract` - 获取合同列表
- `GET /api/contract/:id` - 获取合同详情
- `POST /api/contract` - 创建合同
- `PUT /api/contract/:id` - 更新合同
- `DELETE /api/contract/:id` - 删除合同
- `POST /api/contract/:id/upload` - 上传合同文件
- `GET /api/contract/search/:keyword` - 搜索合同
- `GET /api/contract/stats/summary` - 获取合同统计

### 应付管理

- `GET /api/payment` - 获取付款列表
- `GET /api/payment/:id` - 获取付款详情
- `POST /api/payment` - 创建付款记录
- `PUT /api/payment/:id` - 更新付款记录
- `POST /api/payment/:id/pay` - 记录付款
- `DELETE /api/payment/:id` - 删除付款记录
- `POST /api/payment/:id/upload-receipt` - 上传付款凭证
- `GET /api/payment/stats/summary` - 获取付款统计
- `GET /api/payment/overdue/list` - 获取逾期付款

### 附件管理

- `GET /api/attachment` - 获取附件列表
- `GET /api/attachment/:id` - 获取附件详情
- `POST /api/attachment` - 上传附件
- `PUT /api/attachment/:id` - 更新附件信息
- `DELETE /api/attachment/:id` - 删除附件
- `GET /api/attachment/:id/download` - 下载附件
- `GET /api/attachment/payment/:paymentId` - 获取付款相关附件
- `GET /api/attachment/contract/:contractId` - 获取合同相关附件
- `GET /api/attachment/stats/summary` - 获取附件统计

### 仪表板

- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/warnings` - 获取预警信息
- `GET /api/dashboard/charts` - 获取图表数据

## 数据库设计

系统包含以下主要数据表：

- **Suppliers**: 供应商信息
- **Contracts**: 合同信息
- **Payments**: 付款记录
- **Attachments**: 附件管理

详细的数据库结构请参考 `database.sql` 文件。

## 安全特性

- JWT令牌认证
- 请求频率限制
- 输入数据验证
- SQL注入防护
- 文件类型和大小限制
- CORS配置
- Helmet安全头

## 开发说明

### 添加新的API端点

1. 在 `routes/` 目录下创建新的路由文件
2. 在 `server.js` 中注册新路由
3. 实现相应的业务逻辑

### 数据库操作

使用 `config/database.js` 中的工具函数：

```javascript
const { query, transaction } = require('../config/database');

// 执行查询
const results = await query('SELECT * FROM table WHERE id = ?', [id]);

// 执行事务
await transaction(async (connection) => {
  // 事务操作
});
```

### 错误处理

所有API都应该包含适当的错误处理：

```javascript
try {
  // 业务逻辑
} catch (error) {
  console.error('操作失败:', error);
  res.status(500).json({
    success: false,
    message: '操作失败'
  });
}
```

## 部署

### 生产环境配置

1. 设置 `NODE_ENV=production`
2. 配置生产数据库连接
3. 设置强密码的JWT密钥
4. 配置反向代理（如Nginx）
5. 使用PM2等进程管理器

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 许可证

ISC License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
