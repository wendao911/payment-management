const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有银行账户
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await query(`
      SELECT 
        ba.*,
        b.BankName,
        b.BankCode
      FROM bankaccounts ba
      LEFT JOIN banks b ON ba.BankId = b.Id
      WHERE ba.IsActive = TRUE
      ORDER BY ba.CreatedAt DESC
    `);

    // 为每个银行账户获取余额记录，构建树结构
    for (let account of accounts) {
      const balances = await query(`
        SELECT 
          Id,
          BankAccountId,
          Balance,
          BalanceStatus,
          Notes,
          CreatedAt,
          UpdatedAt
        FROM BankAccountBalances 
        WHERE BankAccountId = ?
        ORDER BY CreatedAt DESC
      `, [account.Id]);
      
      // 将余额记录作为子节点，并添加一些统计信息
      account.children = balances;
      account.balanceCount = balances.length;
      account.latestBalance = balances.length > 0 ? balances[0].Balance : account.CurrentBalance;
      account.latestBalanceDate = balances.length > 0 ? balances[0].CreatedAt : null;
    }
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('获取银行账户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行账户列表失败'
    });
  }
});

// 搜索银行账户
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, accountName, bankId, accountType, currency, isActive } = req.query;
    
    let sql = `
      SELECT ba.*, b.BankName, b.BankCode, c.Name as CountryName, c.Code as CountryCode
      FROM BankAccounts ba
      LEFT JOIN Banks b ON ba.BankId = b.Id
      LEFT JOIN Countries c ON b.CountryId = c.Id
      WHERE 1=1
    `;
    const params = [];
    
    if (accountNumber) {
      sql += ` AND ba.AccountNumber LIKE ?`;
      params.push(`%${accountNumber}%`);
    }
    
    if (accountName) {
      sql += ` AND ba.AccountName LIKE ?`;
      params.push(`%${accountName}%`);
    }
    
    if (bankId) {
      sql += ` AND ba.BankId = ?`;
      params.push(bankId);
    }
    
    if (accountType) {
      sql += ` AND ba.AccountType = ?`;
      params.push(accountType);
    }
    
    if (currency) {
      sql += ` AND ba.CurrencyCode = ?`;
      params.push(currency);
    }
    
    if (isActive !== undefined) {
      sql += ` AND ba.IsActive = ?`;
      params.push(isActive === 'true');
    }
    
    sql += ` ORDER BY c.Name ASC, b.BankName ASC, ba.AccountName ASC`;
    
    const accounts = await query(sql, params);
    
    // 为每个银行账户获取余额记录，构建树结构
    for (let account of accounts) {
      const balances = await query(`
        SELECT 
          Id,
          BankAccountId,
          Balance,
          BalanceStatus,
          Notes,
          CreatedAt,
          UpdatedAt
        FROM BankAccountBalances 
        WHERE BankAccountId = ?
        ORDER BY CreatedAt DESC
      `, [account.Id]);
      
      // 将余额记录作为子节点
      account.children = balances;
    }
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('搜索银行账户错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索银行账户失败'
    });
  }
});

// 获取单个银行账户
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const accounts = await query(`
      SELECT ba.*, b.BankName, b.BankCode, c.Name as CountryName, c.Code as CountryCode
      FROM BankAccounts ba
      LEFT JOIN Banks b ON ba.BankId = b.Id
      LEFT JOIN Countries c ON b.CountryId = c.Id
      WHERE ba.Id = ? AND ba.IsActive = TRUE
    `, [id]);
    
    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '银行账户不存在'
      });
    }
    
    const account = accounts[0];
    
    // 获取该账户的余额记录
    const balances = await query(`
      SELECT 
        Id,
        BankAccountId,
        Balance,
        BalanceStatus,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM BankAccountBalances 
      WHERE BankAccountId = ?
      ORDER BY CreatedAt DESC
    `, [id]);
    
    // 将余额记录添加到账户信息中
    account.balanceRecords = balances;
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('获取银行账户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行账户详情失败'
    });
  }
});

// 根据银行获取账户
router.get('/bank/:bankId', authenticateToken, async (req, res) => {
  try {
    const { bankId } = req.params;
    const accounts = await query(`
      SELECT * FROM BankAccounts 
      WHERE BankId = ? AND IsActive = TRUE
      ORDER BY AccountName ASC
    `, [bankId]);
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('获取银行账户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取银行账户列表失败'
    });
  }
});

// 创建银行账户
router.post('/', authenticateToken, [
  body('bankId').isInt().withMessage('银行ID必须是整数'),
  body('accountNumber').notEmpty().withMessage('账户号码不能为空'),
  body('accountName').notEmpty().withMessage('账户名称不能为空'),
  body('accountType').isIn(['Checking', 'Savings', 'Investment', 'Other']).withMessage('账户类型无效'),
  body('currencyCode').notEmpty().withMessage('币种不能为空'),
  body('initialBalance').isFloat({ min: 0 }).withMessage('初始余额必须是非负数'),
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

    const { bankId, accountNumber, accountName, accountType, currencyCode, initialBalance, notes } = req.body;

    // 检查银行是否存在
    const banks = await query(
      'SELECT Id FROM banks WHERE Id = ? AND IsActive = TRUE',
      [bankId]
    );
    
    if (banks.length === 0) {
      return res.status(400).json({
        success: false,
        message: '指定的银行不存在'
      });
    }

    // 检查账户号码是否已存在
    const existingAccounts = await query(
      'SELECT Id FROM bankaccounts WHERE BankId = ? AND AccountNumber = ?',
      [bankId, accountNumber]
    );
    
    if (existingAccounts.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该银行下账户号码已存在'
      });
    }

    // 处理可能为undefined的参数，转换为null
    const processedNotes = notes === undefined ? null : notes;
    const processedInitialBalance = initialBalance === undefined ? 0 : initialBalance;

    const result = await query(`
      INSERT INTO bankaccounts (
        BankId, AccountNumber, AccountName, AccountType, CurrencyCode, InitialBalance, CurrentBalance, Notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [bankId, accountNumber, accountName, accountType, currencyCode, processedInitialBalance, processedInitialBalance, processedNotes]);

    res.json({
      success: true,
      message: '银行账户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建银行账户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建银行账户失败'
    });
  }
});

// 更新银行账户
router.put('/:id', authenticateToken, [
  body('bankId').isInt().withMessage('银行ID必须是整数'),
  body('accountNumber').notEmpty().withMessage('账户号码不能为空'),
  body('accountName').notEmpty().withMessage('账户名称不能为空'),
  body('accountType').isIn(['Checking', 'Savings', 'Investment', 'Other']).withMessage('账户类型无效'),
  body('currencyCode').notEmpty().withMessage('币种不能为空'),
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
    const { bankId, accountNumber, accountName, accountType, currencyCode, notes } = req.body;

    // 检查银行是否存在
    const banks = await query(
      'SELECT Id FROM banks WHERE Id = ? AND IsActive = TRUE',
      [bankId]
    );
    
    if (banks.length === 0) {
      return res.status(400).json({
        success: false,
        message: '指定的银行不存在'
      });
    }

    // 检查账户号码是否已被其他记录使用
    const existingAccounts = await query(
      'SELECT Id FROM bankaccounts WHERE BankId = ? AND AccountNumber = ? AND Id != ?',
      [bankId, accountNumber, id]
    );
    
    if (existingAccounts.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该银行下账户号码已被其他记录使用'
      });
    }

    // 处理可能为undefined的参数，转换为null
    const processedNotes = notes === undefined ? null : notes;

    await query(`
      UPDATE bankaccounts 
      SET BankId = ?, AccountNumber = ?, AccountName = ?, AccountType = ?, CurrencyCode = ?, Notes = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `, [bankId, accountNumber, accountName, accountType, currencyCode, processedNotes, id]);

    res.json({
      success: true,
      message: '银行账户更新成功'
    });
  } catch (error) {
    console.error('更新银行账户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新银行账户失败'
    });
  }
});

// 删除银行账户（软删除）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查银行账户是否存在
    const accounts = await query(
      'SELECT Id FROM BankAccounts WHERE Id = ? AND IsActive = TRUE',
      [id]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '银行账户不存在'
      });
    }

    // 软删除银行账户
    await query(
      'UPDATE BankAccounts SET IsActive = FALSE, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '银行账户删除成功'
    });
  } catch (error) {
    console.error('删除银行账户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除银行账户失败'
    });
  }
});

// 获取账户余额统计
router.get('/:id/balance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const balanceInfo = await query(`
      SELECT 
        CurrentBalance,
        CurrencyCode
      FROM BankAccounts
      WHERE Id = ? AND IsActive = TRUE
    `, [id]);
    
    if (balanceInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: '银行账户不存在'
      });
    }
    
    res.json({
      success: true,
      data: balanceInfo[0]
    });
  } catch (error) {
    console.error('获取账户余额错误:', error);
    res.status(500).json({
      success: false,
      message: '获取账户余额失败'
    });
  }
});

module.exports = router;
