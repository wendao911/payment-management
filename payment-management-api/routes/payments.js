const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const router = express.Router();

// 获取所有应付管理记录
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        c.TotalAmount as ContractAmount,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact,
        s.Phone as SupplierPhone,
        s.Email as SupplierEmail,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol,
        COALESCE(SUM(pr.PaymentAmount), 0) as TotalPaidAmount,
        (pm.PayableAmount - COALESCE(SUM(pr.PaymentAmount), 0)) as RemainingAmount
      FROM payablemanagement pm
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      LEFT JOIN PaymentRecords pr ON pm.Id = pr.PayableManagementId
      GROUP BY pm.Id
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC
    `);
    
    res.json({
      success: true,
      data: payables
    });
  } catch (error) {
    console.error('获取应付管理列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取应付管理列表失败'
    });
  }
});

// 搜索应付管理记录
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      payableNumber, supplierId, contractId, supplierName, contractNumber, status, 
      importance, urgency, startDate, endDate, minAmount, maxAmount, currencyCode 
    } = req.query;
    
    let sql = `
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        c.TotalAmount as ContractAmount,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact,
        s.Phone as SupplierPhone,
        s.Email as SupplierEmail,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol,
        COALESCE(SUM(pr.PaymentAmount), 0) as TotalPaidAmount,
        (pm.PayableAmount - COALESCE(SUM(pr.PaymentAmount), 0)) as RemainingAmount
      FROM payablemanagement pm
      LEFT JOIN contracts c ON pm.ContractId = c.Id
      LEFT JOIN suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN currencies cur ON pm.CurrencyCode = cur.Code
      LEFT JOIN paymentrecords pr ON pm.Id = pr.PayableManagementId
      WHERE 1=1
    `;
    const params = [];
    
    if (payableNumber) {
      sql += ` AND pm.PayableNumber LIKE ?`;
      params.push(`%${payableNumber}%`);
    }
    
    if (supplierId) {
      sql += ` AND pm.SupplierId = ?`;
      params.push(supplierId);
    } else if (supplierName) {
      sql += ` AND s.Name LIKE ?`;
      params.push(`%${supplierName}%`);
    }
    
    if (contractId) {
      sql += ` AND pm.ContractId = ?`;
      params.push(contractId);
    } else if (contractNumber) {
      sql += ` AND c.ContractNumber LIKE ?`;
      params.push(`%${contractNumber}%`);
    }
    
    if (status) {
      sql += ` AND pm.Status = ?`;
      params.push(status);
    }
    
    if (importance) {
      sql += ` AND pm.Importance = ?`;
      params.push(importance);
    }
    
    if (urgency) {
      sql += ` AND pm.Urgency = ?`;
      params.push(urgency);
    }
    
    // 移除币种筛选
    
    if (startDate && endDate) {
      sql += ` AND pm.PaymentDueDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    // 移除金额范围筛选
    
    sql += ` GROUP BY pm.Id ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC`;
    
    const payables = await query(sql, params);
    
    res.json({
      success: true,
      data: payables
    });
  } catch (error) {
    console.error('搜索应付管理记录错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索应付管理记录失败'
    });
  }
});

// 获取单个应付管理记录
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取应付管理主记录
    const payables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        c.TotalAmount as ContractAmount,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact,
        s.Phone as SupplierPhone,
        s.Email as SupplierEmail,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM payablemanagement pm
      LEFT JOIN contracts c ON pm.ContractId = c.Id
      LEFT JOIN suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN currencies cur ON pm.CurrencyCode = cur.Code
      WHERE pm.Id = ?
    `, [id]);
    
    if (payables.length === 0) {
      return res.status(404).json({
        success: false,
        message: '应付管理记录不存在'
      });
    }
    
    // 获取付款记录
    const paymentRecords = await query(`
      SELECT 
        pr.*,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM paymentrecords pr
      LEFT JOIN currencies cur ON pr.CurrencyCode = cur.Code
      WHERE pr.PayableManagementId = ?
      ORDER BY pr.PaymentDate DESC
    `, [id]);
    
    // 获取附件
    const attachments = await query(`
      SELECT * FROM attachments 
      WHERE RelatedTable = 'PayableManagement' AND RelatedId = ?
      ORDER BY CreatedAt DESC
    `, [id]);
    
    const result = {
      ...payables[0],
      paymentRecords,
      attachments
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取应付管理详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取应付管理详情失败'
    });
  }
});

// 创建应付管理记录
router.post('/', authenticateToken, [
  body('payableNumber').optional().notEmpty().withMessage('应付编号不能为空'),
  body('contractId').isInt({ min: 1 }).withMessage('合同ID无效'),
  body('supplierId').isInt({ min: 1 }).withMessage('供应商ID无效'),
  body('payableAmount').isFloat({ min: 0 }).withMessage('应付金额必须大于0'),
  body('currencyCode').notEmpty().withMessage('币种不能为空'),
  body('paymentDueDate').notEmpty().withMessage('付款截止日期不能为空'),
  body('importance').optional().isIn(['normal', 'important', 'very_important']).withMessage('重要程度无效'),
  body('urgency').optional().isIn(['normal', 'urgent', 'very_urgent', 'overdue']).withMessage('紧急程度无效'),
  body('description').optional().isLength({ max: 500 }).withMessage('应付说明不能超过500个字符'),
  body('notes').optional().isLength({ max: 500 }).withMessage('备注不能超过500个字符')
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
      contractId, supplierId, payableAmount, 
      currencyCode, paymentDueDate, importance, urgency, description, notes
    } = req.body;

    // 检查合同是否存在
    const contracts = await query(
      'SELECT Id, TotalAmount FROM contracts WHERE Id = ?',
      [contractId]
    );
    
    if (contracts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 检查供应商是否存在
    const suppliers = await query(
      'SELECT Id FROM suppliers WHERE Id = ?',
      [supplierId]
    );
    
    if (suppliers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '供应商不存在'
      });
    }

    // 检查合同和供应商是否匹配
    const contractSuppliers = await query(
      'SELECT Id FROM contracts WHERE Id = ? AND SupplierId = ?',
      [contractId, supplierId]
    );
    
    if (contractSuppliers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '合同与供应商不匹配'
      });
    }

    // 检查币种是否存在
    const currencies = await query(
      'SELECT Code FROM currencies WHERE Code = ? AND IsActive = TRUE',
      [currencyCode]
    );
    
    if (currencies.length === 0) {
      return res.status(400).json({
        success: false,
        message: '币种不存在或未启用'
      });
    }

    // 使用前端传入的应付编号，如果没有则自动生成
    const payableNumber = req.body.payableNumber || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 如果前端传入了应付编号，检查是否已存在
    if (req.body.payableNumber) {
      const existingPayableNumbers = await query(
        'SELECT Id FROM payablemanagement WHERE PayableNumber = ?',
        [payableNumber]
      );
      
      if (existingPayableNumbers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '应付编号已存在，请使用其他编号'
        });
      }
    }

    // 使用事务创建业务记录并关联临时附件
    const result = await transaction(async (connection) => {
      // 1. 创建业务记录
      const [insertResult] = await connection.execute(`
        INSERT INTO payablemanagement (
          ContractId, SupplierId, PayableNumber, PayableAmount, CurrencyCode,
          PaymentDueDate, Importance, Urgency, Description, Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [contractId, supplierId, payableNumber, payableAmount, currencyCode, 
          paymentDueDate, importance || 'normal', urgency || 'normal', description || null, notes || null]);
      
      const formId = insertResult.insertId;
      
      // 2. 如果有临时附件，更新其关联关系
      // if (tempAttachmentIds.length > 0) { // This line is removed
      //   const updateAttachmentsQuery = `
      //     UPDATE attachments 
      //     SET RelatedTable = 'PayableManagement', RelatedId = ? 
      //     WHERE Id IN (?) AND RelatedTable = 'Temp'
      //   `;
        
      //   await connection.execute(updateAttachmentsQuery, [formId, tempAttachmentIds]);
      // }
      
      return { insertId: formId };
    });

    res.status(201).json({
      success: true,
      message: '应付管理记录创建成功',
      data: { 
        Id: result.insertId,
        payableNumber 
      }
    });
  } catch (error) {
    console.error('创建应付管理记录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建应付管理记录失败'
    });
  }
});

// 更新应付管理记录
router.put('/:id', authenticateToken, [
  body('payableNumber').optional().notEmpty().withMessage('应付编号不能为空'),
  body('payableAmount').optional().isFloat({ min: 0 }).withMessage('应付金额必须大于0'),
  body('currencyCode').optional().notEmpty().withMessage('币种不能为空'),
  body('importance').optional().isIn(['normal', 'important', 'very_important']).withMessage('重要程度无效'),
  body('urgency').optional().isIn(['normal', 'urgent', 'very_urgent', 'overdue']).withMessage('紧急程度无效'),
  body('status').optional().isIn(['pending', 'partial', 'completed', 'overdue']).withMessage('状态无效'),
  body('description').optional().isLength({ max: 500 }).withMessage('应付说明不能超过500个字符'),
  body('notes').optional().isLength({ max: 500 }).withMessage('备注不能超过500个字符')
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
    
    // 检查应付管理记录是否存在
    const existingPayables = await query(
      'SELECT Id FROM payablemanagement WHERE Id = ?',
      [id]
    );
    
    if (existingPayables.length === 0) {
      return res.status(404).json({
        success: false,
        message: '应付管理记录不存在'
      });
    }

    // 如果更新币种，检查币种是否存在
    if (updateData.currencyCode) {
      const currencies = await query(
        'SELECT Code FROM currencies WHERE Code = ? AND IsActive = TRUE',
        [updateData.currencyCode]
      );
      
      if (currencies.length === 0) {
        return res.status(400).json({
          success: false,
          message: '币种不存在或未启用'
        });
      }
    }
    
    // 如果更新应付编号，检查是否与其他记录重复
    if (updateData.payableNumber) {
      const existingPayableNumbers = await query(
        'SELECT Id FROM payablemanagement WHERE PayableNumber = ? AND Id != ?',
        [updateData.payableNumber, id]
      );
      
      if (existingPayableNumbers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '应付编号已存在，请使用其他编号'
        });
      }
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
      `UPDATE payablemanagement SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?`,
      values
    );

    res.json({
      success: true,
      message: '应付管理记录更新成功'
    });
  } catch (error) {
    console.error('更新应付管理记录错误:', error);
    res.status(500).json({
      success: false,
      message: '更新应付管理记录失败'
    });
  }
});

// 删除应付管理记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有关联的附件
    const attachments = await query(
      'SELECT COUNT(*) as count FROM attachments WHERE RelatedTable = "PayableManagement" AND RelatedId = ?',
      [id]
    );
    
    if (attachments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除：该应付管理记录有关联的附件'
      });
    }

    // 检查是否有关联的付款记录
    const paymentRecords = await query(
      'SELECT COUNT(*) as count FROM paymentrecords WHERE PayableManagementId = ?',
      [id]
    );
    
    if (paymentRecords[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除：该应付管理记录有关联的付款记录'
      });
    }

    await query('DELETE FROM payablemanagement WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: '应付管理记录删除成功'
    });
  } catch (error) {
    console.error('删除应付管理记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除应付管理记录失败'
    });
  }
});

// 上传附件
router.post('/:id/attachments', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    // 检查应付管理记录是否存在
    const payables = await query(
      'SELECT Id FROM payablemanagement WHERE Id = ?',
      [id]
    );
    
    if (payables.length === 0) {
      return res.status(404).json({
        success: false,
        message: '应付管理记录不存在'
      });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const result = await query(`
        INSERT INTO attachments (
          FileName, OriginalFileName, FilePath, FileSize, FileType, MimeType,
          RelatedTable, RelatedId, UploadedBy
        ) VALUES (?, ?, ?, ?, ?, ?, 'PayableManagement', ?, ?)
      `, [
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype.split('/')[1],
        file.mimetype,
        id,
        req.user.id
      ]);
      
      uploadedFiles.push({
        id: result.insertId,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size
      });
    }

    res.json({
      success: true,
      message: '附件上传成功',
      data: uploadedFiles
    });
  } catch (error) {
    console.error('上传附件错误:', error);
    res.status(500).json({
      success: false,
      message: '上传附件失败'
    });
  }
});

// 删除附件
router.delete('/attachments/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // 获取附件信息
    const attachments = await query(
      'SELECT * FROM attachments WHERE Id = ?',
      [attachmentId]
    );
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }
    
    // 删除附件记录
    await query('DELETE FROM attachments WHERE Id = ?', [attachmentId]);
    
    res.json({
      success: true,
      message: '附件删除成功'
    });
  } catch (error) {
    console.error('删除附件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除附件失败'
    });
  }
});

// 获取币种列表
router.get('/currencies/list', authenticateToken, async (req, res) => {
  try {
    const currencies = await query(`
      SELECT Code, Name, Symbol, ExchangeRate 
      FROM Currencies 
      WHERE IsActive = TRUE 
      ORDER BY Code
    `);
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('获取币种列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取币种列表失败'
    });
  }
});

// 获取应付管理统计信息
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as totalPayables,
        SUM(PayableAmount) as totalAmount,
        COUNT(CASE WHEN Status = 'pending' THEN 1 END) as pendingPayables,
        COUNT(CASE WHEN Status = 'partial' THEN 1 END) as partialPayables,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedPayables,
        COUNT(CASE WHEN Status = 'overdue' THEN 1 END) as overduePayables,
        COUNT(CASE WHEN Importance = 'very_important' THEN 1 END) as veryImportantPayables,
        COUNT(CASE WHEN Urgency = 'very_urgent' THEN 1 END) as veryUrgentPayables
      FROM PayableManagement
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取应付管理统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取应付管理统计信息失败'
    });
  }
});

// 获取逾期应付
router.get('/overdue/list', authenticateToken, async (req, res) => {
  try {
    const overduePayables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM PayableManagement pm
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE pm.PaymentDueDate < NOW() AND pm.Status != 'completed'
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC
    `);
    
    res.json({
      success: true,
      data: overduePayables
    });
  } catch (error) {
    console.error('获取逾期应付错误:', error);
    res.status(500).json({
      success: false,
      message: '获取逾期应付失败'
    });
  }
});

// 获取即将到期的应付（7天内）
router.get('/upcoming/list', authenticateToken, async (req, res) => {
  try {
    const upcomingPayables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM PayableManagement pm
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE pm.PaymentDueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND pm.Status != 'completed'
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC
    `);
    
    res.json({
      success: true,
      data: upcomingPayables
    });
  } catch (error) {
    console.error('获取即将到期应付错误:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到期应付失败'
    });
  }
});

// 获取重要应付
router.get('/important/list', authenticateToken, async (req, res) => {
  try {
    const importantPayables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM PayableManagement pm
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE pm.Importance IN ('important', 'very_important') AND pm.Status != 'completed'
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC
    `);
    
    res.json({
      success: true,
      data: importantPayables
    });
  } catch (error) {
    console.error('获取重要应付错误:', error);
    res.status(500).json({
      success: false,
      message: '获取重要应付失败'
    });
  }
});

// 获取所有预警应付
router.get('/warnings/list', authenticateToken, async (req, res) => {
  try {
    const warningPayables = await query(`
      SELECT 
        pm.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM PayableManagement pm
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE (pm.PaymentDueDate < NOW() OR 
             (pm.PaymentDueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) OR
              pm.Importance IN ('important', 'very_important')))
        AND pm.Status != 'completed'
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC, pm.Urgency DESC
    `);
    
    res.json({
      success: true,
      data: warningPayables
    });
  } catch (error) {
    console.error('获取预警应付错误:', error);
    res.status(500).json({
      success: false,
      message: '获取预警应付失败'
    });
  }
});

module.exports = router;
