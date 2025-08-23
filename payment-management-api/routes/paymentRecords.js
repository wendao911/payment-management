const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ExcelJS = require('exceljs');
const router = express.Router();

// 获取所有付款记录
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, paymentNumber, payableManagementId, supplierId, contractId, startDate, endDate } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * pageSizeNum;
    
    let sql = `
      SELECT 
        pr.*,
        pr.PayableManagementId,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol,
        pm.PayableNumber,
        pm.ContractId,
        pm.SupplierId,
        pm.Description as Description,
        s.Name as SupplierName,
        c.ContractNumber,
        c.Title as ContractTitle,
        (
          SELECT COUNT(*) FROM Attachments a 
          WHERE a.RelatedTable = 'PaymentRecords' AND a.RelatedId = pr.Id
        ) as AttachmentCount
      FROM PaymentRecords pr
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      WHERE 1=1
    `;
    const params = [];
    
    if (paymentNumber) {
      sql += ` AND pr.PaymentNumber LIKE ?`;
      params.push(`%${paymentNumber}%`);
    }
    
    if (payableManagementId) {
      sql += ` AND pr.PayableManagementId = ?`;
      params.push(payableManagementId);
    }
    
    if (supplierId) {
      sql += ` AND pm.SupplierId = ?`;
      params.push(supplierId);
    }

    if (contractId) {
      sql += ` AND pm.ContractId = ?`;
      params.push(contractId);
    }
    
    if (startDate && endDate) {
      sql += ` AND pr.PaymentDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    // 获取总数：构建独立且稳定的统计SQL，避免子查询导致的替换问题
    const countParams = [];
    let countSql = `
      SELECT COUNT(*) as total
      FROM PaymentRecords pr
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      WHERE 1=1
    `;
    if (paymentNumber) {
      countSql += ` AND pr.PaymentNumber LIKE ?`;
      countParams.push(`%${paymentNumber}%`);
    }
    if (payableManagementId) {
      countSql += ` AND pr.PayableManagementId = ?`;
      countParams.push(payableManagementId);
    }
    if (supplierId) {
      countSql += ` AND pm.SupplierId = ?`;
      countParams.push(supplierId);
    }
    if (contractId) {
      countSql += ` AND pm.ContractId = ?`;
      countParams.push(contractId);
    }
    if (startDate && endDate) {
      countSql += ` AND pr.PaymentDate BETWEEN ? AND ?`;
      countParams.push(startDate, endDate);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    // 获取分页数据
    sql += ` ORDER BY pr.PaymentDate DESC LIMIT ${pageSizeNum} OFFSET ${offset}`;
    
    const paymentRecords = await query(sql, params);
    
    res.json({
      success: true,
      data: paymentRecords,
      pagination: {
        current: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('获取付款记录列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款记录列表失败'
    });
  }
});

// 获取指定应付管理的所有付款记录
router.get('/payable/:payableId', authenticateToken, async (req, res) => {
  try {
    const { payableId } = req.params;
    
    // 检查应付管理记录是否存在
    const payables = await query(
      'SELECT Id FROM PayableManagement WHERE Id = ?',
      [payableId]
    );
    
    if (payables.length === 0) {
      return res.status(404).json({
        success: false,
        message: '应付管理记录不存在'
      });
    }
    
    const paymentRecords = await query(`
      SELECT 
        pr.*,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol
      FROM PaymentRecords pr
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      WHERE pr.PayableManagementId = ?
      ORDER BY pr.PaymentDate DESC
    `, [payableId]);
    
    res.json({
      success: true,
      data: paymentRecords
    });
  } catch (error) {
    console.error('获取付款记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款记录失败'
    });
  }
});

// 获取单个付款记录详情（含关联信息与附件）
router.get('/detail/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const records = await query(`
      SELECT 
        pr.*,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol,
        pm.PayableNumber,
        pm.ContractId,
        pm.SupplierId,
        s.Name as SupplierName,
        c.ContractNumber,
        c.Title as ContractTitle
      FROM PaymentRecords pr
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      WHERE pr.Id = ?
      LIMIT 1
    `, [id]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: '付款记录不存在'
      });
    }

    const attachments = await query(`
      SELECT * FROM Attachments 
      WHERE RelatedTable = 'PaymentRecords' AND RelatedId = ?
      ORDER BY CreatedAt DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...records[0],
        attachments
      }
    });
  } catch (error) {
    console.error('获取付款记录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款记录详情失败'
    });
  }
});

// 创建付款记录
router.post('/', authenticateToken, [
  body('PaymentNumber').optional().notEmpty().withMessage('付款编号不能为空'),
  body('PayableManagementId').isInt({ min: 1 }).withMessage('应付管理ID无效'),
  body('CurrencyCode').notEmpty().withMessage('币种不能为空'),
  body('PaymentDescription').notEmpty().withMessage('付款说明不能为空'),
  body('PaymentAmount').isFloat({ min: 0 }).withMessage('付款金额必须大于0'),
  body('PaymentDate').notEmpty().withMessage('付款日期不能为空'),
  body('Notes').optional().isLength({ max: 500 }).withMessage('备注不能超过500个字符')
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
      PaymentNumber, PayableManagementId, CurrencyCode, PaymentDescription, 
      PaymentAmount, PaymentDate, Notes
    } = req.body;

    // 处理字段名大小写问题，支持前端传递的大写字段名
    const finalPaymentNumber = PaymentNumber || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalPayableManagementId = PayableManagementId;
    const finalCurrencyCode = CurrencyCode;
    const finalPaymentDescription = PaymentDescription;
    const finalPaymentAmount = PaymentAmount;
    const finalPaymentDate = PaymentDate;
    const finalNotes = Notes;

    // 检查应付管理记录是否存在
    const payables = await query(
      'SELECT Id, PayableAmount, Status FROM PayableManagement WHERE Id = ?',
      [payableManagementId]
    );
    
    if (payables.length === 0) {
      return res.status(400).json({
        success: false,
        message: '应付管理记录不存在'
      });
    }

    // 检查币种是否存在
    const currencies = await query(
      'SELECT Code FROM Currencies WHERE Code = ? AND IsActive = TRUE',
      [currencyCode]
    );
    
    if (currencies.length === 0) {
      return res.status(400).json({
        success: false,
        message: '币种不存在或未启用'
      });
    }

    // 检查付款金额是否超过应付金额
    const totalPaid = await query(`
      SELECT COALESCE(SUM(PaymentAmount), 0) as totalPaid
      FROM PaymentRecords 
      WHERE PayableManagementId = ?
    `, [payableManagementId]);
    
    const remainingAmount = parseFloat(payables[0].PayableAmount) - parseFloat(totalPaid[0].totalPaid);
    
    if (parseFloat(paymentAmount) > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `付款金额不能超过剩余应付金额 ${remainingAmount}`
      });
    }

    // 生成付款编号，如果没有传入则自动生成
    // finalPaymentNumber 已经在上面声明了
    
    // 如果前端传入了付款编号，检查是否已存在（列不存在时跳过检查）
    if (PaymentNumber) {
      try {
        const existingPaymentNumbers = await query(
          'SELECT Id FROM PaymentRecords WHERE PaymentNumber = ? LIMIT 1',
          [finalPaymentNumber]
        );
        if (existingPaymentNumbers.length > 0) {
          return res.status(400).json({
            success: false,
            message: '付款编号已存在，请使用其他编号'
          });
        }
      } catch (uniqueErr) {
        if (uniqueErr?.code === 'ER_BAD_FIELD_ERROR') {
          console.warn('PaymentNumber 列不存在，跳过唯一性检查');
        } else {
          throw uniqueErr;
        }
      }
    }

    // 使用事务创建业务记录并关联临时附件
    const result = await transaction(async (connection) => {
      // 1. 创建付款记录
      let insertResult;
      try {
        [insertResult] = await connection.execute(`
          INSERT INTO PaymentRecords (
            PaymentNumber, PayableManagementId, CurrencyCode, PaymentDescription, 
            PaymentAmount, PaymentDate, Notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          finalPaymentNumber,
          Number(finalPayableManagementId),
          String(finalCurrencyCode),
          String(finalPaymentDescription || ''),
          Number(finalPaymentAmount),
          String(finalPaymentDate),
          finalNotes ?? null
        ]);
      } catch (insertError) {
        // 如果 PaymentNumber 字段不存在，降级为不插入该字段
        if (insertError?.code === 'ER_BAD_FIELD_ERROR' && /PaymentNumber/i.test(insertError?.sqlMessage || '')) {
          console.warn('检测到 PaymentNumber 字段不存在，回退为不带付款编号的插入');
          [insertResult] = await connection.execute(`
            INSERT INTO PaymentRecords (
              PayableManagementId, CurrencyCode, PaymentDescription, 
              PaymentAmount, PaymentDate, Notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            Number(finalPayableManagementId),
            String(finalCurrencyCode),
            String(finalPaymentDescription || ''),
            Number(finalPaymentAmount),
            String(finalPaymentDate),
            finalNotes ?? null
          ]);
        } else {
          throw insertError;
        }
      }
      
      const formId = insertResult.insertId;
      
      // 2. 如果有临时附件，更新其关联关系
      // 删除临时附件ID的验证和处理逻辑
      
      // 3. 更新应付管理状态
      const newTotalPaid = parseFloat(totalPaid[0].totalPaid) + parseFloat(paymentAmount);
      let newStatus = 'pending';
      
      if (newTotalPaid >= parseFloat(payables[0].PayableAmount)) {
        newStatus = 'completed';
      } else if (newTotalPaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'pending';
      }

      await connection.execute(`
        UPDATE PayableManagement 
        SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP(6)
        WHERE Id = ?
      `, [newStatus, payableManagementId]);
      
      return { insertId: formId, newStatus };
    });

    res.status(201).json({
      success: true,
      message: '付款记录创建成功',
      data: { 
        Id: result.insertId,
        paymentNumber: finalPaymentNumber,
        newStatus: result.newStatus
      }
    });
  } catch (error) {
    console.error('创建付款记录错误:', error);
    res.status(500).json({
      success: false,
      message: error?.sqlMessage || error?.message || '创建付款记录失败'
    });
  }
});

// 更新付款记录
router.put('/:id', authenticateToken, [
  body('currencyCode').optional().notEmpty().withMessage('币种不能为空'),
  body('paymentDescription').optional().notEmpty().withMessage('付款说明不能为空'),
  body('paymentAmount').optional().isFloat({ min: 0 }).withMessage('付款金额必须大于0'),
  body('paymentDate').optional().notEmpty().withMessage('付款日期不能为空'),
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
    
    // 检查付款记录是否存在
    const existingRecords = await query(
      'SELECT * FROM PaymentRecords WHERE Id = ?',
      [id]
    );
    
    if (existingRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: '付款记录不存在'
      });
    }

    const record = existingRecords[0];
    
    // 如果更新币种，检查币种是否存在
    if (updateData.currencyCode) {
      const currencies = await query(
        'SELECT Code FROM Currencies WHERE Code = ? AND IsActive = TRUE',
        [updateData.currencyCode]
      );
      
      if (currencies.length === 0) {
        return res.status(400).json({
          success: false,
          message: '币种不存在或未启用'
        });
      }
    }

    // 如果更新金额，需要重新计算应付管理状态
    if (updateData.paymentAmount) {
      const oldAmount = parseFloat(record.PaymentAmount);
      const newAmount = parseFloat(updateData.paymentAmount);
      const amountDiff = newAmount - oldAmount;
      
      // 获取其他付款记录的总和
      const otherPayments = await query(`
        SELECT COALESCE(SUM(PaymentAmount), 0) as totalOther
        FROM PaymentRecords 
        WHERE PayableManagementId = ? AND Id != ?
      `, [record.PayableManagementId, id]);
      
      const totalOtherAmount = parseFloat(otherPayments[0].totalOther);
      const newTotalPaid = totalOtherAmount + newAmount;
      
      // 获取应付管理记录
      const payables = await query(
        'SELECT PayableAmount FROM PayableManagement WHERE Id = ?',
        [record.PayableManagementId]
      );
      
      if (newTotalPaid > parseFloat(payables[0].PayableAmount)) {
        return res.status(400).json({
          success: false,
          message: '更新后的付款金额不能超过应付金额'
        });
      }
      
      // 更新应付管理状态
      let newStatus = 'pending';
      if (newTotalPaid >= parseFloat(payables[0].PayableAmount)) {
        newStatus = 'completed';
      } else if (newTotalPaid > 0) {
        newStatus = 'partial';
      }
      
      await query(`
        UPDATE PayableManagement 
        SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP(6)
        WHERE Id = ?
      `, [newStatus, record.PayableManagementId]);
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
      `UPDATE PaymentRecords SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?`,
      values
    );

    res.json({
      success: true,
      message: '付款记录更新成功'
    });
  } catch (error) {
    console.error('更新付款记录错误:', error);
    res.status(500).json({
      success: false,
      message: '更新付款记录失败'
    });
  }
});

// 删除付款记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查付款记录是否存在
    const records = await query(
      'SELECT * FROM PaymentRecords WHERE Id = ?',
      [id]
    );
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: '付款记录不存在'
      });
    }

    const record = records[0];
    
    // 检查是否有关联的附件
    const attachments = await query(
      'SELECT COUNT(*) as count FROM Attachments WHERE RelatedTable = "PaymentRecords" AND RelatedId = ?',
      [id]
    );
    
    if (attachments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除：该付款记录有关联的附件'
      });
    }

    // 删除付款记录
    await query('DELETE FROM PaymentRecords WHERE Id = ?', [id]);
    
    // 重新计算应付管理状态
    const totalPaid = await query(`
      SELECT COALESCE(SUM(PaymentAmount), 0) as totalPaid
      FROM PaymentRecords 
      WHERE PayableManagementId = ?
    `, [record.PayableManagementId]);
    
    const payables = await query(
      'SELECT PayableAmount FROM PayableManagement WHERE Id = ?',
      [record.PayableManagementId]
    );
    
    let newStatus = 'pending';
    if (parseFloat(totalPaid[0].totalPaid) >= parseFloat(payables[0].PayableAmount)) {
      newStatus = 'completed';
    } else if (parseFloat(totalPaid[0].totalPaid) > 0) {
      newStatus = 'partial';
    }
    
    await query(`
      UPDATE PayableManagement 
      SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP(6)
      WHERE Id = ?
    `, [newStatus, record.PayableManagementId]);
    
    res.json({
      success: true,
      message: '付款记录删除成功'
    });
  } catch (error) {
    console.error('删除付款记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除付款记录失败'
    });
  }
});

// 上传付款凭证附件
router.post('/:id/attachments', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    // 检查付款记录是否存在
    const records = await query(
      'SELECT Id FROM PaymentRecords WHERE Id = ?',
      [id]
    );
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: '付款记录不存在'
      });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const result = await query(`
        INSERT INTO Attachments (
          FileName, OriginalFileName, FilePath, FileSize, FileType, MimeType,
          RelatedTable, RelatedId, UploadedBy
        ) VALUES (?, ?, ?, ?, ?, ?, 'PaymentRecords', ?, ?)
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
      message: '付款凭证上传成功',
      data: uploadedFiles
    });
  } catch (error) {
    console.error('上传付款凭证错误:', error);
    res.status(500).json({
      success: false,
      message: '上传付款凭证失败'
    });
  }
});

// 获取付款记录统计信息
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as totalRecords,
        SUM(PaymentAmount) as totalAmount,
        COUNT(DISTINCT PayableManagementId) as totalPayables,
        COUNT(CASE WHEN PaymentDate >= CURDATE() - INTERVAL 30 DAY THEN 1 END) as recentPayments
      FROM PaymentRecords
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取付款记录统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款记录统计信息失败'
    });
  }
});

// 导出付款记录到Excel
router.get('/export/excel', authenticateToken, async (req, res) => {
  try {
    const { paymentNumber, payableManagementId, supplierId, contractId, startDate, endDate } = req.query;
    
    // 构建查询SQL，与列表查询保持一致
    let sql = `
      SELECT 
        pr.*,
        pr.PayableManagementId,
        cur.Name as CurrencyName,
        cur.Symbol as CurrencySymbol,
        pm.PayableNumber,
        pm.ContractId,
        pm.SupplierId,
        pm.Description as Description,
        s.Name as SupplierName,
        c.ContractNumber,
        c.Title as ContractTitle
      FROM PaymentRecords pr
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      WHERE 1=1
    `;
    const params = [];
    
    if (paymentNumber) {
      sql += ` AND pr.PaymentNumber LIKE ?`;
      params.push(`%${paymentNumber}%`);
    }
    
    if (payableManagementId) {
      sql += ` AND pr.PayableManagementId = ?`;
      params.push(payableManagementId);
    }
    
    if (supplierId) {
      sql += ` AND pm.SupplierId = ?`;
      params.push(supplierId);
    }

    if (contractId) {
      sql += ` AND pm.ContractId = ?`;
      params.push(contractId);
    }
    
    if (startDate && endDate) {
      sql += ` AND pr.PaymentDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    sql += ` ORDER BY pr.PaymentDate DESC`;
    
    const paymentRecords = await query(sql, params);
    
    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('付款记录');
    
    // 设置列标题（与前端表格保持一致）
    worksheet.columns = [
      { header: '付款编号', key: 'paymentNumber', width: 20 },
      { header: '应付编号', key: 'payableNumber', width: 20 },
      { header: '应付说明', key: 'description', width: 30 },
      { header: '合同编号', key: 'contractNumber', width: 25 },
      { header: '供应商', key: 'supplierName', width: 20 },
      { header: '付款说明', key: 'paymentDescription', width: 30 },
      { header: '付款金额', key: 'paymentAmount', width: 15 },
      { header: '币种', key: 'currencyCode', width: 10 },
      { header: '金额(USD)', key: 'amountUSD', width: 15 },
      { header: '付款日期', key: 'paymentDate', width: 15 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 添加数据行
    paymentRecords.forEach(record => {
      // 计算USD金额
      const upper = String(record.CurrencyCode || record.currencyCode || '').toUpperCase();
      const rate = upper === 'USD' ? 1 : upper === 'CNY' || upper === 'RMB' ? 7.2 : 1;
      const usd = Number(record.PaymentAmount || record.paymentAmount || 0) / (rate || 1);
      
      // 格式化合同信息
      const contractNumber = record.ContractNumber || record.contractNumber || '';
      const contractTitle = record.ContractTitle || record.Title || '';
      const contractInfo = contractNumber && contractTitle ? `${contractNumber} - ${contractTitle}` : (contractNumber || contractTitle || '');
      
      worksheet.addRow({
        paymentNumber: record.PaymentNumber || record.paymentNumber || '-',
        payableNumber: record.PayableNumber || '-',
        description: record.Description || '-',
        contractNumber: contractInfo,
        supplierName: record.SupplierName || record.supplierName || '-',
        paymentDescription: record.PaymentDescription || record.paymentDescription || '-',
        paymentAmount: Number(record.PaymentAmount || record.paymentAmount || 0),
        currencyCode: record.CurrencyCode || record.currencyCode || '-',
        amountUSD: usd.toFixed(2),
        paymentDate: record.PaymentDate || record.paymentDate ? new Date(record.PaymentDate || record.paymentDate).toLocaleDateString('zh-CN') : '-',
        notes: record.Notes || record.notes || '-'
      });
    });
    
    // 设置响应头
    const fileName = `付款记录_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    
    // 写入响应流
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('导出Excel错误:', error);
    res.status(500).json({
      success: false,
      message: '导出Excel失败'
    });
  }
});

module.exports = router;
