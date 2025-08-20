const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有供应商
router.get('/', authenticateToken, async (req, res) => {
  try {
    const suppliers = await query(`
      SELECT * FROM Suppliers 
      ORDER BY CreatedAt DESC
    `);
    
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('获取供应商列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商列表失败'
    });
  }
});

// 搜索供应商
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { supplierName, contactPerson, phone, email, isActive } = req.query;
    
    let sql = `SELECT * FROM Suppliers WHERE 1=1`;
    const params = [];
    
    if (supplierName) {
      sql += ` AND Name LIKE ?`;
      params.push(`%${supplierName}%`);
    }
    
    if (contactPerson) {
      sql += ` AND ContactPerson LIKE ?`;
      params.push(`%${contactPerson}%`);
    }
    
    if (phone) {
      sql += ` AND Phone LIKE ?`;
      params.push(`%${phone}%`);
    }
    
    if (email) {
      sql += ` AND Email LIKE ?`;
      params.push(`%${email}%`);
    }
    
    if (isActive !== undefined) {
      sql += ` AND IsActive = ?`;
      params.push(isActive === 'true');
    }
    
    sql += ` ORDER BY CreatedAt DESC`;
    
    const suppliers = await query(sql, params);
    
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('搜索供应商错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索供应商失败'
    });
  }
});

// 获取单个供应商
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const suppliers = await query(
      'SELECT * FROM Suppliers WHERE Id = ?',
      [id]
    );
    
    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    res.json({
      success: true,
      data: suppliers[0]
    });
  } catch (error) {
    console.error('获取供应商详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商详情失败'
    });
  }
});

// 创建供应商
router.post('/', authenticateToken, [
  body('Name').notEmpty().withMessage('供应商名称不能为空'),
  body('Address').optional(),
  body('ContactPerson').optional(),
  body('Phone').optional(),
  body('Email').optional(),
  body('TaxNumber').optional(),
  body('BankAccount').optional(),
  body('BankName').optional(),
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

    const {
      Name, Address, ContactPerson, Phone, Email, 
      TaxNumber, BankAccount, BankName, IsActive = true
    } = req.body;
    
    // 转换IsActive为布尔值
    const isActiveBoolean = IsActive === 'true' ? true : IsActive === 'false' ? false : IsActive;

    // 检查名称是否已存在
    const existingSuppliers = await query(
      'SELECT Id FROM Suppliers WHERE Name = ?',
      [Name]
    );
    
    if (existingSuppliers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '供应商名称已存在'
      });
    }

    const result = await query(`
      INSERT INTO Suppliers (Name, Address, ContactPerson, Phone, Email, TaxNumber, BankAccount, BankName, IsActive, CreatedAt, UpdatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [Name, Address, ContactPerson, Phone, Email, TaxNumber, BankAccount, BankName, isActiveBoolean]);

    res.status(201).json({
      success: true,
      message: '供应商创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建供应商错误:', error);
    console.error('请求体数据:', req.body);
    console.error('错误详情:', error.message);
    res.status(500).json({
      success: false,
      message: '创建供应商失败',
      error: error.message
    });
  }
});

// 更新供应商
router.put('/:id', authenticateToken, [
  body('Name').optional().notEmpty().withMessage('供应商名称不能为空'),
  body('Email').optional(),
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
    const updateData = req.body;
    
    // 转换IsActive为布尔值
    if (updateData.IsActive !== undefined) {
      updateData.IsActive = updateData.IsActive === 'true' ? true : updateData.IsActive === 'false' ? false : updateData.IsActive;
    }
    
    // 检查供应商是否存在
    const existingSuppliers = await query(
      'SELECT Id FROM Suppliers WHERE Id = ?',
      [id]
    );
    
    if (existingSuppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }

    // 如果更新名称，检查名称是否已被其他记录使用
    if (updateData.Name) {
      const nameCheck = await query(
        'SELECT Id FROM Suppliers WHERE Name = ? AND Id != ?',
        [updateData.Name, id]
      );
      
      if (nameCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: '供应商名称已被其他记录使用'
        });
      }
    }

    // 构建更新SQL
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的数据'
      });
    }
    
    updateFields.push('UpdatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `UPDATE Suppliers SET ${updateFields.join(', ')} WHERE Id = ?`;
    
    await query(sql, updateValues);

    res.json({
      success: true,
      message: '供应商更新成功'
    });
  } catch (error) {
    console.error('更新供应商错误:', error);
    console.error('请求体数据:', req.body);
    console.error('请求参数ID:', req.params.id);
    console.error('错误详情:', error.message);
    res.status(500).json({
      success: false,
      message: '更新供应商失败',
      error: error.message
    });
  }
});

// 删除供应商
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('尝试删除供应商:', id);
    
    // 检查是否有关联的合同
    const contracts = await query(
      'SELECT COUNT(*) as count FROM Contracts WHERE SupplierId = ?',
      [id]
    );
    
    // 检查是否有关联的应付管理记录
    const payables = await query(
      'SELECT COUNT(*) as count FROM PayableManagement WHERE SupplierId = ?',
      [id]
    );
    
    console.log('关联检查结果:', {
      contracts: contracts[0].count,
      payables: payables[0].count
    });
    
    if (contracts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `无法删除：该供应商有关联的合同记录（${contracts[0].count}个）`
      });
    }
    
    if (payables[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `无法删除：该供应商有关联的应付管理记录（${payables[0].count}个）`
      });
    }

    // 执行删除
    const result = await query('DELETE FROM Suppliers WHERE Id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在或已被删除'
      });
    }
    
    console.log('供应商删除成功:', id);
    
    res.json({
      success: true,
      message: '供应商删除成功'
    });
  } catch (error) {
    console.error('删除供应商错误:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '删除供应商失败',
      error: error.message
    });
  }
});

module.exports = router;
