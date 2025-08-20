const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// 导入路由
const authRouter = require('./routes/auth');
const suppliersRouter = require('./routes/suppliers');
const contractsRouter = require('./routes/contracts');
const paymentsRouter = require('./routes/payments');
const paymentRecordsRouter = require('./routes/paymentRecords');
const attachmentsRouter = require('./routes/attachments');
const dashboardRouter = require('./routes/dashboard');
const countriesRouter = require('./routes/countries');
const banksRouter = require('./routes/banks');
const bankAccountsRouter = require('./routes/bankAccounts');
const bankAccountBalancesRouter = require('./routes/bankAccountBalances');
const currenciesRouter = require('./routes/currencies');

const app = express();
const PORT = process.env.PORT || 5000;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（比如移动端应用）
    if (!origin) return callback(null, true);
    
    // 允许本地开发 - 使用环境变量或动态检测
    const localHosts = process.env.LOCAL_HOSTS ? process.env.LOCAL_HOSTS.split(',') : ['localhost', '127.0.0.1'];
    if (localHosts.some(host => origin.includes(host))) {
      return callback(null, true);
    }
    
    // 允许局域网访问（192.168.x.x, 10.x.x.x, 172.16-31.x.x）
    if (origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
      return callback(null, true);
    }
    
    // 生产环境限制来源
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    
    // 开发环境允许所有来源
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 99999, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 日志中间件
app.use(morgan('combined'));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '应付管理系统API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRouter);
app.use('/api/supplier', suppliersRouter);
app.use('/api/contract', contractsRouter);
app.use('/api/payment', paymentsRouter);
app.use('/api/payment-records', paymentRecordsRouter);
app.use('/api/attachment', attachmentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/countries', countriesRouter);
app.use('/api/banks', banksRouter);
app.use('/api/bank-accounts', bankAccountsRouter);
app.use('/api/bank-account-balances', bankAccountBalancesRouter);
app.use('/api/currencies', currenciesRouter);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的API端点不存在'
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  
  // 数据库连接错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: '数据库连接失败，请检查数据库服务状态'
    });
  }
  
  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '文件大小超出限制'
    });
  }
  
  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: error.errors
    });
  }
  
  // 默认错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 无法连接到数据库，服务器启动失败');
      process.exit(1);
    }

    // 启动HTTP服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 应付管理系统API服务已启动`);
      console.log(`📍 服务地址: http://${process.env.HOST || 'localhost'}:${PORT}`);
      console.log(`🌐 局域网地址: http://0.0.0.0:${PORT}`);
      console.log(`📊 健康检查: http://${process.env.HOST || 'localhost'}:${PORT}/health`);
      console.log(`🔒 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer();
