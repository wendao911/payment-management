const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取银行账户的所有余额记录
router.get('/account/:bankAccountId', authenticateToken, async (req, res) => {
  try {
    const { bankAccountId } = req.params;
    
    const balances = await query(`
      SELECT 
        bab.*,
        ba.AccountNumber,
        ba.AccountName,
        b.BankName
      FROM BankAccountBalances bab
      LEFT JOIN BankAccounts ba ON bab.BankAccountId = ba.Id
      LEFT JOIN Banks b ON ba.BankId = b.Id
      WHERE bab.BankAccountId = ?
      ORDER BY bab.CreatedAt DESC
    `, [bankAccountId]);
    
    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('获取银行账户余额记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行账户余额记录失败'
    });
  }
});

// 创建银行账户余额记录
router.post('/', authenticateToken, [
  body('bankAccountId').isInt({ min: 1 }).withMessage('银行账户ID无效'),
  body('balance').isFloat({ min: 0 }).withMessage('余额必须是非负数'),
  body('balanceStatus').isIn(['Available', 'Unavailable']).withMessage('余额状态无效'),
  body('notes').optional()
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

    const { bankAccountId, balance, balanceStatus, notes } = req.body;

    // 检查银行账户是否存在
    const accounts = await query(
      'SELECT Id FROM BankAccounts WHERE Id = ? AND IsActive = TRUE',
      [bankAccountId]
    );
    
    if (accounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '银行账户不存在'
      });
    }

    const result = await query(`
      INSERT INTO BankAccountBalances (
        BankAccountId, Balance, BalanceStatus, Notes
      ) VALUES (?, ?, ?, ?)
    `, [bankAccountId, balance, balanceStatus, notes || null]);

    res.status(201).json({
      success: true,
      message: '银行账户余额记录创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建银行账户余额记录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建银行账户余额记录失败'
    });
  }
});

// 更新银行账户余额记录
router.put('/:id', authenticateToken, [
  body('balance').optional().isFloat({ min: 0 }).withMessage('余额必须是非负数'),
  body('balanceStatus').optional().isIn(['Available', 'Unavailable']).withMessage('余额状态无效'),
  body('notes').optional()
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
    
    // 检查余额记录是否存在
    const balances = await query(
      'SELECT Id FROM BankAccountBalances WHERE Id = ?',
      [id]
    );
    
    if (balances.length === 0) {
      return res.status(404).json({
        success: false,
        message: '余额记录不存在'
      });
    }

    // 构建更新SQL
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的数据'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(id);

    await query(
      `UPDATE BankAccountBalances SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?`,
      values
    );

    res.json({
      success: true,
      message: '银行账户余额记录更新成功'
    });
  } catch (error) {
    console.error('更新银行账户余额记录错误:', error);
    res.status(500).json({
      success: false,
      message: '更新银行账户余额记录失败'
    });
  }
});

// 删除银行账户余额记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查余额记录是否存在
    const balances = await query(
      'SELECT Id FROM BankAccountBalances WHERE Id = ?',
      [id]
    );
    
    if (balances.length === 0) {
      return res.status(404).json({
        success: false,
        message: '余额记录不存在'
      });
    }

    await query('DELETE FROM BankAccountBalances WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: '银行账户余额记录删除成功'
    });
  } catch (error) {
    console.error('删除银行账户余额记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除银行账户余额记录失败'
    });
  }
});

module.exports = router;
