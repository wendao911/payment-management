const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有币种
router.get('/', authenticateToken, async (req, res) => {
  try {
    const Currencies = await query(`
      SELECT * FROM currencies 
      WHERE IsActive = TRUE
      ORDER BY Code ASC
    `);
    
    res.json({
      success: true,
      data: Currencies
    });
  } catch (error) {
    console.error('获取币种列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取币种列表失败'
    });
  }
});

// 获取单个币种
router.get('/:Id', authenticateToken, async (req, res) => {
  try {
    const { Id } = req.params;
    const Currencies = await query(`
      SELECT * FROM currencies 
      WHERE Id = ? AND IsActive = TRUE
    `, [Id]);
    
    if (Currencies.length === 0) {
      return res.status(404).json({
        success: false,
        message: '币种不存在'
      });
    }
    
    res.json({
      success: true,
      data: Currencies[0]
    });
  } catch (error) {
    console.error('获取币种详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取币种详情失败'
    });
  }
});

// 搜索币种
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { Code, Name, IsActive } = req.query;
    
    let Sql = `SELECT * FROM currencies WHERE 1=1`;
    const Params = [];
    
    if (Code) {
      Sql += ` AND Code LIKE ?`;
      Params.push(`%${Code}%`);
    }
    
    if (Name) {
      Sql += ` AND Name LIKE ?`;
      Params.push(`%${Name}%`);
    }
    
    if (IsActive !== undefined) {
      Sql += ` AND IsActive = ?`;
      Params.push(IsActive === 'true' ? 1 : 0);
    }
    
    Sql += ` ORDER BY Code ASC`;
    
    const Currencies = await query(Sql, Params);
    
    res.json({
      success: true,
      data: Currencies
    });
  } catch (error) {
    console.error('搜索币种错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索币种失败'
    });
  }
});

// 创建币种
router.post('/', authenticateToken, [
  body('Code').isLength({ min: 1, max: 3 }).withMessage('币种代码长度必须在1-3个字符之间'),
  body('Name').isLength({ min: 1, max: 50 }).withMessage('币种名称长度必须在1-50个字符之间'),
  body('Symbol').optional().isLength({ max: 10 }).withMessage('币种符号长度不能超过10个字符'),
  body('ExchangeRate').optional().isFloat({ min: 0 }).withMessage('汇率必须是非负数'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { Code, Name, Symbol, ExchangeRate } = req.body;
    
    // 检查币种代码是否已存在
    const existingCurrency = await query(`
      SELECT Id FROM currencies WHERE Code = ?
    `, [Code]);
    
    if (existingCurrency.length > 0) {
      return res.status(400).json({
        success: false,
        message: '币种代码已存在'
      });
    }

    const result = await query(`
      INSERT INTO currencies (Code, Name, Symbol, ExchangeRate, IsActive)
      VALUES (?, ?, ?, ?, TRUE)
    `, [Code, Name, Symbol || null, ExchangeRate || 1.000000]);

    const newCurrency = await query(`
      SELECT * FROM currencies WHERE Id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: '币种创建成功',
      data: newCurrency[0]
    });
  } catch (error) {
    console.error('创建币种错误:', error);
    res.status(500).json({
      success: false,
      message: '创建币种失败'
    });
  }
});

// 更新币种
router.put('/:Id', authenticateToken, [
  body('Code').isLength({ min: 1, max: 3 }).withMessage('币种代码长度必须在1-3个字符之间'),
  body('Name').isLength({ min: 1, max: 50 }).withMessage('币种名称长度必须在1-50个字符之间'),
  body('Symbol').optional().isLength({ max: 10 }).withMessage('币种符号长度不能超过10个字符'),
  body('ExchangeRate').optional().isFloat({ min: 0 }).withMessage('汇率必须是非负数'),
  body('IsActive').optional().isBoolean().withMessage('启用状态必须是布尔值'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { Id } = req.params;
    const { Code, Name, Symbol, ExchangeRate, IsActive } = req.body;
    
    // 检查币种是否存在
    const existingCurrency = await query(`
      SELECT Id FROM currencies WHERE Id = ?
    `, [Id]);
    
    if (existingCurrency.length === 0) {
      return res.status(404).json({
        success: false,
        message: '币种不存在'
      });
    }

    // 检查币种代码是否已被其他币种使用
    const duplicateCode = await query(`
      SELECT Id FROM currencies WHERE Code = ? AND Id != ?
    `, [Code, Id]);
    
    if (duplicateCode.length > 0) {
      return res.status(400).json({
        success: false,
        message: '币种代码已被其他币种使用'
      });
    }

    const updateResult = await query(`
      UPDATE currencies 
      SET Code = ?, Name = ?, Symbol = ?, ExchangeRate = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `, [Code, Name, Symbol || null, ExchangeRate || 1.000000, IsActive !== undefined ? IsActive : 1, Id]);

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: '更新失败，币种可能已被删除'
      });
    }

    const updatedCurrency = await query(`
      SELECT * FROM currencies WHERE Id = ?
    `, [Id]);

    res.json({
      success: true,
      message: '币种更新成功',
      data: updatedCurrency[0]
    });
  } catch (error) {
    console.error('更新币种错误:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '更新币种失败';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = '币种代码已存在';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = '引用的记录不存在';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = '数据长度超出限制';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 删除币种（软删除）
router.delete('/:Id', authenticateToken, async (req, res) => {
  try {
    const { Id } = req.params;
    
    // 检查币种是否存在
    const existingCurrency = await query(`
      SELECT Id FROM currencies WHERE Id = ?
    `, [Id]);
    
    if (existingCurrency.length === 0) {
      return res.status(404).json({
        success: false,
        message: '币种不存在'
      });
    }

    // 检查币种是否被使用
    const usedInBankAccounts = await query(`
      SELECT COUNT(*) as Count FROM bankaccounts WHERE CurrencyCode = (SELECT Code FROM currencies WHERE Id = ?)
    `, [Id]);
    
    const usedInPayables = await query(`
      SELECT COUNT(*) as Count FROM payablemanagement WHERE CurrencyCode = (SELECT Code FROM currencies WHERE Id = ?)
    `, [Id]);
    
    const usedInPayments = await query(`
      SELECT COUNT(*) as Count FROM paymentrecords WHERE CurrencyCode = (SELECT Code FROM currencies WHERE Id = ?)
    `, [Id]);

    if (usedInBankAccounts[0].Count > 0 || usedInPayables[0].Count > 0 || usedInPayments[0].Count > 0) {
      return res.status(400).json({
        success: false,
        message: '币种正在被使用，无法删除'
      });
    }

    // 软删除
    await query(`
      UPDATE currencies SET IsActive = FALSE, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?
    `, [Id]);

    res.json({
      success: true,
      message: '币种删除成功'
    });
  } catch (error) {
    console.error('删除币种错误:', error);
    res.status(500).json({
      success: false,
      message: '删除币种失败'
    });
  }
});

// 批量更新汇率
router.post('/batch-update-rates', authenticateToken, [
  body('Rates').isArray().withMessage('汇率数据必须是数组'),
  body('Rates.*.Code').isLength({ min: 1, max: 3 }).withMessage('币种代码长度必须在1-3个字符之间'),
  body('Rates.*.ExchangeRate').isFloat({ min: 0 }).withMessage('汇率必须是非负数'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { Rates } = req.body;
    
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      for (const rate of Rates) {
        const { Code, ExchangeRate } = rate;
        await conn.execute(`
          UPDATE currencies 
          SET ExchangeRate = ?, UpdatedAt = CURRENT_TIMESTAMP 
          WHERE Code = ?
        `, [ExchangeRate, Code]);
      }
      
      await conn.commit();
      
      res.json({
        success: true,
        message: '汇率批量更新成功'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('批量更新汇率错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新汇率失败'
    });
  }
});

module.exports = router;
