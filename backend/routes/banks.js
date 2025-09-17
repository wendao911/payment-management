const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有银行
router.get('/', authenticateToken, async (req, res) => {
  try {
    const banks = await query(`
      SELECT b.*, c.Name as CountryName, c.Code as CountryCode
      FROM Banks b
      LEFT JOIN Countries c ON b.CountryId = c.Id
      WHERE b.IsActive = TRUE
      ORDER BY c.Name ASC, b.BankName ASC
    `);
    
    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    console.error('获取银行列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行列表失败'
    });
  }
});

// 获取单个银行
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const banks = await query(`
      SELECT b.*, c.Name as CountryName, c.Code as CountryCode
      FROM Banks b
      LEFT JOIN Countries c ON b.CountryId = c.Id
      WHERE b.Id = ? AND b.IsActive = TRUE
    `, [id]);
    
    if (banks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '银行不存在'
      });
    }
    
    res.json({
      success: true,
      data: banks[0]
    });
  } catch (error) {
    console.error('获取银行详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行详情失败'
    });
  }
});

// 根据国家获取银行
router.get('/country/:countryId', authenticateToken, async (req, res) => {
  try {
    const { countryId } = req.params;
    const banks = await query(`
      SELECT * FROM Banks 
      WHERE CountryId = ? AND IsActive = TRUE
      ORDER BY BankName ASC
    `, [countryId]);
    
    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    console.error('获取国家银行列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取国家银行列表失败'
    });
  }
});

// 搜索银行
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { bankCode, bankName, bankType, countryId, isActive } = req.query;
    
    let sql = `
      SELECT b.*, c.Name as CountryName, c.Code as CountryCode
      FROM Banks b
      LEFT JOIN Countries c ON b.CountryId = c.Id
      WHERE 1=1
    `;
    const params = [];
    
    if (bankCode) {
      sql += ` AND b.BankCode LIKE ?`;
      params.push(`%${bankCode}%`);
    }
    
    if (bankName) {
      sql += ` AND b.BankName LIKE ?`;
      params.push(`%${bankName}%`);
    }
    
    if (bankType) {
      sql += ` AND b.BankType = ?`;
      params.push(bankType);
    }
    
    if (countryId) {
      sql += ` AND b.CountryId = ?`;
      params.push(countryId);
    }
    
    if (isActive !== undefined) {
      sql += ` AND b.IsActive = ?`;
      params.push(isActive === 'true');
    }
    
    sql += ` ORDER BY c.Name ASC, b.BankName ASC`;
    
    const banks = await query(sql, params);
    
    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    console.error('搜索银行错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索银行失败'
    });
  }
});

// 创建银行
router.post('/', authenticateToken, [
  body('CountryId').isInt().withMessage('国家ID必须是整数'),
  body('BankCode').notEmpty().withMessage('银行代码不能为空'),
  body('BankName').notEmpty().withMessage('银行名称不能为空'),
  body('BankType').isIn(['Commercial', 'Investment', 'Central', 'Other']).withMessage('银行类型无效'),
  body('Website').optional(),
  body('IsActive').optional().custom((value) => {
    if (value === undefined || value === null) return true;
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

    const { CountryId, BankCode, BankName, BankType, Website, IsActive = true } = req.body;
    
    // 转换IsActive为布尔值
    const isActiveBoolean = IsActive === 'true' ? true : IsActive === 'false' ? false : IsActive;
    
    // 确保IsActive是有效的布尔值
    if (typeof isActiveBoolean !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '状态字段必须是有效的布尔值'
      });
    }
    
    // 过滤掉undefined值，设置默认值
    const websiteValue = Website && Website.trim() !== '' ? Website : null;
    const bankTypeValue = BankType || 'Commercial';

    // 检查国家是否存在
    const countries = await query(
      'SELECT Id FROM Countries WHERE Id = ? AND IsActive = TRUE',
      [CountryId]
    );
    
    if (countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: '指定的国家不存在'
      });
    }

    // 检查银行代码是否已存在
    const existingBanks = await query(
      'SELECT Id FROM Banks WHERE CountryId = ? AND BankCode = ?',
      [CountryId, BankCode]
    );
    
    if (existingBanks.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该国家下银行代码已存在'
      });
    }

    const result = await query(`
      INSERT INTO Banks (CountryId, BankCode, BankName, BankType, Website, IsActive, CreatedAt, UpdatedAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [CountryId, BankCode, BankName, bankTypeValue, websiteValue, isActiveBoolean]);

    res.json({
      success: true,
      message: '银行创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建银行错误:', error);
    console.error('请求体数据:', req.body);
    console.error('错误详情:', error.message);
    res.status(500).json({
      success: false,
      message: '创建银行失败',
      error: error.message
    });
  }
});

// 更新银行
router.put('/:id', authenticateToken, [
  body('CountryId').isInt().withMessage('国家ID必须是整数'),
  body('BankCode').notEmpty().withMessage('银行代码不能为空'),
  body('BankName').notEmpty().withMessage('银行名称不能为空'),
  body('BankType').isIn(['Commercial', 'Investment', 'Central', 'Other']).withMessage('银行类型无效'),
  body('Website').optional(),
  body('IsActive').optional().custom((value) => {
    if (value === undefined || value === null) return true;
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
    const { CountryId, BankCode, BankName, BankType, Website, IsActive } = req.body;
    
    // 转换IsActive为布尔值
    const isActiveBoolean = IsActive === 'true' ? true : IsActive === 'false' ? false : IsActive;
    
    // 确保IsActive是有效的布尔值
    if (typeof isActiveBoolean !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '状态字段必须是有效的布尔值'
      });
    }
    
    // 过滤掉undefined值，设置默认值
    const websiteValue = Website && Website.trim() !== '' ? Website : null;
    const bankTypeValue = BankType || 'Commercial';

    // 检查国家是否存在
    const countries = await query(
      'SELECT Id FROM Countries WHERE Id = ? AND IsActive = TRUE',
      [CountryId]
    );
    
    if (countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: '指定的国家不存在'
      });
    }

    // 检查银行代码是否已被其他记录使用
    const existingBanks = await query(
      'SELECT Id FROM Banks WHERE CountryId = ? AND BankCode = ? AND Id != ?',
      [CountryId, BankCode, id]
    );
    
    if (existingBanks.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该国家下银行代码已被其他记录使用'
      });
    }

    await query(`
      UPDATE Banks 
      SET CountryId = ?, BankCode = ?, BankName = ?, BankType = ?, Website = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `, [CountryId, BankCode, BankName, bankTypeValue, websiteValue, isActiveBoolean, id]);

    res.json({
      success: true,
      message: '银行更新成功'
    });
  } catch (error) {
    console.error('更新银行错误:', error);
    console.error('请求体数据:', req.body);
    console.error('请求参数ID:', req.params.id);
    console.error('错误详情:', error.message);
    res.status(500).json({
      success: false,
      message: '更新银行失败',
      error: error.message
    });
  }
});

// 删除银行（软删除）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有关联的银行账户
    const relatedAccounts = await query(
      'SELECT COUNT(*) as count FROM BankAccounts WHERE BankId = ?',
      [id]
    );
    
    if (relatedAccounts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该银行下存在账户记录，无法删除'
      });
    }

    await query(
      'UPDATE Banks SET IsActive = FALSE, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '银行删除成功'
    });
  } catch (error) {
    console.error('删除银行错误:', error);
    res.status(500).json({
      success: false,
      message: '删除银行失败'
    });
  }
});

module.exports = router;
