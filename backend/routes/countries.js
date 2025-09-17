const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有国家
router.get('/', authenticateToken, async (req, res) => {
  try {
    const countries = await query(`
      SELECT * FROM Countries 
      WHERE IsActive = TRUE
      ORDER BY Name ASC
    `);
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('获取国家列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取国家列表失败'
    });
  }
});

// 搜索国家
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { code, name, isActive } = req.query;
    
    let sql = `SELECT * FROM Countries WHERE 1=1`;
    const params = [];
    
    if (code) {
      sql += ` AND Code LIKE ?`;
      params.push(`%${code}%`);
    }
    
    if (name) {
      sql += ` AND Name LIKE ?`;
      params.push(`%${name}%`);
    }
    
    if (isActive !== undefined) {
      sql += ` AND IsActive = ?`;
      params.push(isActive === 'true');
    }
    
    sql += ` ORDER BY Name ASC`;
    
    const countries = await query(sql, params);
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('搜索国家错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索国家失败'
    });
  }
});

// 获取单个国家
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const countries = await query(
      'SELECT * FROM Countries WHERE Id = ? AND IsActive = TRUE',
      [id]
    );
    
    if (countries.length === 0) {
      return res.status(404).json({
        success: false,
        message: '国家不存在'
      });
    }
    
    res.json({
      success: true,
      data: countries[0]
    });
  } catch (error) {
    console.error('获取国家详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取国家详情失败'
    });
  }
});

// 创建国家
router.post('/', authenticateToken, [
  body('Code').notEmpty().withMessage('国家代码不能为空'),
  body('Name').notEmpty().withMessage('国家名称不能为空'),
  body('CurrencyCode').optional(),
  body('IsActive').notEmpty().withMessage('状态不能为空').custom((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string' && (value === 'true' || value === 'false')) return true;
    throw new Error('状态必须是布尔值');
  })
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

    const { Code, Name, CurrencyCode, IsActive = true } = req.body;
    
    // 转换IsActive为布尔值
    const isActiveBoolean = IsActive === 'true' ? true : IsActive === 'false' ? false : IsActive;

    // 检查代码是否已存在
    const existingCountries = await query(
      'SELECT Id FROM Countries WHERE Code = ?',
      [Code]
    );
    
    if (existingCountries.length > 0) {
      return res.status(400).json({
        success: false,
        message: '国家代码已存在'
      });
    }

    const result = await query(`
      INSERT INTO Countries (Code, Name, CurrencyCode, IsActive)
      VALUES (?, ?, ?, ?)
    `, [Code, Name, CurrencyCode, isActiveBoolean]);

    res.json({
      success: true,
      message: '国家创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建国家错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      errno: error.errno
    });
    res.status(500).json({
      success: false,
      message: '创建国家失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 更新国家
router.put('/:id', authenticateToken, [
  body('Code').notEmpty().withMessage('国家代码不能为空'),
  body('Name').notEmpty().withMessage('国家名称不能为空'),
  body('CurrencyCode').optional(),
  body('IsActive').notEmpty().withMessage('状态不能为空').custom((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string' && (value === 'true' || value === 'false')) return true;
    throw new Error('状态必须是布尔值');
  })
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

    const { id } = req.params;
    const { Code, Name, CurrencyCode, IsActive } = req.body;
    
    // 转换IsActive为布尔值
    const isActiveBoolean = IsActive === 'true' ? true : IsActive === 'false' ? false : IsActive;

    // 检查代码是否已被其他记录使用
    const existingCountries = await query(
      'SELECT Id FROM Countries WHERE Code = ? AND Id != ?',
      [Code, id]
    );
    
    if (existingCountries.length > 0) {
      return res.status(400).json({
        success: false,
        message: '国家代码已被其他记录使用'
      });
    }

    await query(`
      UPDATE Countries 
      SET Code = ?, Name = ?, CurrencyCode = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `, [Code, Name, CurrencyCode, isActiveBoolean, id]);

    res.json({
      success: true,
      message: '国家更新成功'
    });
  } catch (error) {
    console.error('更新国家错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      errno: error.errno
    });
    res.status(500).json({
      success: false,
      message: '更新国家失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 删除国家（软删除）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有关联的银行
    const relatedBanks = await query(
      'SELECT COUNT(*) as count FROM Banks WHERE CountryId = ?',
      [id]
    );
    
    if (relatedBanks[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该国家下存在银行记录，无法删除'
      });
    }

    await query(
      'UPDATE Countries SET IsActive = FALSE, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '国家删除成功'
    });
  } catch (error) {
    console.error('删除国家错误:', error);
    res.status(500).json({
      success: false,
      message: '删除国家失败'
    });
  }
});

module.exports = router;
