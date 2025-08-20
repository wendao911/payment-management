const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型创建子目录
    let subDir = 'general';
    if (file.fieldname === 'contract') {
      subDir = 'contracts';
    } else if (file.fieldname === 'payment') {
      subDir = 'payments';
    } else if (file.fieldname === 'attachment') {
      subDir = 'attachments';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
    files: 5 // 最多5个文件
  }
});

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  console.log('上传中间件错误:', {
    error: error.message,
    code: error.code,
    field: error.field,
    stack: error.stack
  });

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      console.log('文件大小超出限制');
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      console.log('文件数量超出限制');
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
    // 处理其他multer错误
    console.log('Multer错误:', error.code);
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${error.message}`
    });
  }
  
  if (error.message === '不支持的文件类型') {
    console.log('不支持的文件类型:', req.file?.mimetype);
    return res.status(400).json({
      success: false,
      message: '不支持的文件类型'
    });
  }
  
  console.log('其他上传错误:', error.message);
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
