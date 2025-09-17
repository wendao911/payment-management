const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 用户登录
router.post('/login', [
  body('Username').notEmpty().withMessage('用户名不能为空'),
  body('Password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    // 添加调试日志
    console.log('收到登录请求:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      origin: req.get('Origin'),
      userAgent: req.get('User-Agent')
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('登录验证失败:', errors.array());
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { Username, Password: inputPassword } = req.body;
    console.log('尝试登录用户:', Username);

    // 查找用户
    const Users = await query(
      'SELECT * FROM users WHERE Username = ? AND IsActive = TRUE',
      [Username]
    );

    if (Users.length === 0) {
      console.log('用户不存在或已被禁用:', Username);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = Users[0];
    console.log('用户找到:', { id: user.Id, username: user.Username, role: user.Role });

    // 验证密码
    const isValidPassword = await bcrypt.compare(inputPassword, user.Password);
    if (!isValidPassword) {
      console.log('密码验证失败:', Username);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    console.log('密码验证成功:', Username);

    // 生成JWT token
    const token = generateToken(user);

    // 更新最后登录时间
    await query(
      'UPDATE users SET LastLoginAt = CURRENT_TIMESTAMP(6) WHERE Id = ?',
      [user.Id]
    );

    // 返回用户信息和token（不包含密码）
    const { Password: userPassword, ...userInfo } = user;
    
    console.log('登录成功:', { username: Username, userId: user.Id });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userInfo,
        token: token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 用户注册
router.post('/register', [
  body('Username').isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间'),
  body('Password').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  body('Email').isEmail().withMessage('邮箱格式不正确'),
  body('Role').optional().isIn(['user', 'manager']).withMessage('角色只能是user或manager')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { Username, Password, Email, Role = 'user' } = req.body;

    // 检查用户名是否已存在
    const existingUsers = await query(
      'SELECT Id FROM users WHERE Username = ?',
      [Username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const existingEmails = await query(
      'SELECT Id FROM users WHERE Email = ?',
      [Email]
    );
    
    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被使用'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(Password, 10);

    // 创建用户
    const result = await query(`
      INSERT INTO users (Username, Password, Email, Role)
      VALUES (?, ?, ?, ?)
    `, [Username, hashedPassword, Email, Role]);

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const Users = await query(
      'SELECT Id, Username, Email, Role, IsActive, LastLoginAt, CreatedAt FROM users WHERE Id = ?',
      [req.user.id]
    );

    if (Users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: Users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新用户信息
router.put('/me', authenticateToken, [
  body('Email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('Password').optional().isLength({ min: 6 }).withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { Email, Password } = req.body;
    const updateData = {};

    // 如果更新邮箱，检查是否已被其他用户使用
    if (Email) {
      const existingEmails = await query(
        'SELECT Id FROM users WHERE Email = ? AND Id != ?',
        [Email, req.user.id]
      );
      
      if (existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被其他用户使用'
        });
      }
      updateData.Email = Email;
    }

    // 如果更新密码，加密新密码
    if (Password) {
      updateData.Password = await bcrypt.hash(Password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的数据'
      });
    }

    // 构建更新SQL
    const fields = Object.keys(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(req.user.id);

    await query(
      `UPDATE users SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?`,
      values
    );

    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 刷新token（可选功能）
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // 获取最新的用户信息
    const Users = await query(
      'SELECT Id, Username, Role FROM users WHERE Id = ? AND IsActive = TRUE',
      [req.user.id]
    );

    if (Users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    const user = Users[0];
    
    // 生成新的token
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token刷新成功',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('刷新token错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新token失败'
    });
  }
});

// 用户登出（前端处理，这里只是记录日志）
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，可以将token加入黑名单
    // 这里只是返回成功响应
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
});

// 获取所有用户列表（仅管理员）
router.get('/Users', authenticateToken, async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅管理员可访问'
      });
    }

    const Users = await query(`
      SELECT Id, Username, Email, Role, IsActive, LastLoginAt, CreatedAt, UpdatedAt
      FROM users 
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: Users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 管理员更新用户状态
router.put('/Users/:id/status', authenticateToken, [
  body('IsActive').isBoolean().withMessage('IsActive必须是布尔值')
], async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅管理员可访问'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { IsActive } = req.body;

    // 检查用户是否存在
    const existingUsers = await query(
      'SELECT Id FROM users WHERE Id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能禁用自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能禁用自己的账户'
      });
    }

    await query(
      'UPDATE users SET IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?',
      [IsActive, id]
    );

    res.json({
      success: true,
      message: `用户${IsActive ? '启用' : '禁用'}成功`
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败'
    });
  }
});

module.exports = router;
