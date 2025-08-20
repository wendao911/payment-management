const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 获取所有附件
router.get('/', authenticateToken, async (req, res) => {
  try {
    const attachments = await query(`
      SELECT 
        a.*,
        CASE 
          WHEN a.RelatedTable = 'Contracts' THEN c.ContractNumber
          WHEN a.RelatedTable = 'PayableManagement' THEN pm.PayableNumber
          WHEN a.RelatedTable = 'PaymentRecords' THEN pr.PaymentDescription
          ELSE NULL
        END as RelatedNumber,
        CASE 
          WHEN a.RelatedTable = 'Contracts' THEN c.Title
          WHEN a.RelatedTable = 'PayableManagement' THEN c.Title
          ELSE NULL
        END as RelatedTitle,
        s.Name as SupplierName
      FROM Attachments a
      LEFT JOIN Contracts c ON (a.RelatedTable = 'Contracts' AND a.RelatedId = c.Id) 
                           OR (a.RelatedTable = 'PayableManagement' AND a.RelatedId = pm.Id AND pm.ContractId = c.Id)
      LEFT JOIN PayableManagement pm ON a.RelatedTable = 'PayableManagement' AND a.RelatedId = pm.Id
      LEFT JOIN PaymentRecords pr ON a.RelatedTable = 'PaymentRecords' AND a.RelatedId = pr.Id
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      ORDER BY a.CreatedAt DESC
    `);
    
    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('获取附件列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取附件列表失败'
    });
  }
});

// 获取单个附件
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const attachments = await query(`
      SELECT 
        a.*,
        CASE 
          WHEN a.RelatedTable = 'Contracts' THEN c.ContractNumber
          WHEN a.RelatedTable = 'PayableManagement' THEN pm.PayableNumber
          WHEN a.RelatedTable = 'PaymentRecords' THEN pr.PaymentDescription
          ELSE NULL
        END as RelatedNumber,
        CASE 
          WHEN a.RelatedTable = 'Contracts' THEN c.Title
          WHEN a.RelatedTable = 'PayableManagement' THEN c.Title
          ELSE NULL
        END as RelatedTitle,
        s.Name as SupplierName
      FROM Attachments a
      LEFT JOIN Contracts c ON (a.RelatedTable = 'Contracts' AND a.RelatedId = c.Id) 
                           OR (a.RelatedTable = 'PayableManagement' AND a.RelatedId = pm.Id AND pm.ContractId = c.Id)
      LEFT JOIN PayableManagement pm ON a.RelatedTable = 'PayableManagement' AND a.RelatedId = pm.Id
      LEFT JOIN PaymentRecords pr ON a.RelatedTable = 'PaymentRecords' AND a.RelatedId = pr.Id
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      WHERE a.Id = ?
    `, [id]);
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }
    
    res.json({
      success: true,
      data: attachments[0]
    });
  } catch (error) {
    console.error('获取附件详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取附件详情失败'
    });
  }
});

// 上传附件
router.post('/', authenticateToken, upload.single('attachment'), handleUploadError, async (req, res) => {
  try {
    console.log('收到附件上传请求:', {
      body: req.body,
      file: req.file,
      user: req.user,
      headers: req.headers
    });

    if (!req.file) {
      console.log('没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    const { paymentId, contractId, payableId } = req.body;
    console.log('解析的字段:', { paymentId, contractId, payableId });

    let relatedTable = null;
    let relatedId = null;

    // 确定关联表和ID
    if (payableId && payableId !== 'temp') {
      relatedTable = 'PayableManagement';
      relatedId = payableId;
      
      // 验证应付管理记录是否存在
      const payables = await query(
        'SELECT Id FROM PayableManagement WHERE Id = ?',
        [payableId]
      );
      
      if (payables.length === 0) {
        console.log('应付管理记录不存在:', payableId);
        return res.status(400).json({
          success: false,
          message: '应付管理记录不存在'
        });
      }
    } else if (contractId && contractId !== 'temp') {
      relatedTable = 'Contracts';
      relatedId = contractId;
      
      // 验证合同是否存在
      const contracts = await query(
        'SELECT Id FROM Contracts WHERE Id = ?',
        [contractId]
      );
      
      if (contracts.length === 0) {
        console.log('合同不存在:', contractId);
        return res.status(400).json({
          success: false,
          message: '合同不存在'
        });
      }
    } else if (paymentId && paymentId !== 'temp') {
      relatedTable = 'PaymentRecords';
      relatedId = paymentId;
      
      // 验证付款记录是否存在
      const payments = await query(
        'SELECT Id FROM PaymentRecords WHERE Id = ?',
        [paymentId]
      );
      
      if (payments.length === 0) {
        console.log('付款记录不存在:', paymentId);
        return res.status(400).json({
          success: false,
          message: '付款记录不存在'
        });
      }
    }

    // 处理临时附件上传（用于新建记录时）
    if (payableId === 'temp' || contractId === 'temp' || paymentId === 'temp') {
      // 临时附件，先保存到临时表或使用特殊标识
      relatedTable = 'Temp';
      relatedId = 0; // 临时ID，后续会更新
      console.log('处理临时附件上传，使用临时关联');
    }

    if (!relatedTable || relatedId === null) {
      console.log('缺少关联信息');
      return res.status(400).json({
        success: false,
        message: '必须关联应付管理、合同或付款记录'
      });
    }

    console.log('准备插入附件数据:', {
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      relatedTable: relatedTable,
      relatedId: relatedId
    });

    const result = await query(`
      INSERT INTO Attachments (
        FileName, OriginalFileName, FilePath, FileSize, FileType, MimeType,
        RelatedTable, RelatedId, UploadedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.file.originalname,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      req.file.mimetype,
      relatedTable,
      relatedId,
      req.user?.id || null
    ]);

    console.log('附件插入成功，ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: '附件上传成功',
      data: {
        Id: result.insertId,
        FileName: req.file.originalname,
        OriginalFileName: req.file.originalname,
        FilePath: req.file.path,
        FileSize: req.file.size,
        FileType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('上传附件错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '上传附件失败',
      error: error.message
    });
  }
});

// 更新附件信息
router.put('/:id', authenticateToken, [
  body('contractId').optional().isInt().withMessage('合同ID必须是整数'),
  body('payableId').optional().isInt().withMessage('应付管理ID必须是整数'),
  body('paymentId').optional().isInt().withMessage('付款记录ID必须是整数')
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
    const { contractId, payableId, paymentId } = req.body;
    
    // 检查附件是否存在
    const attachments = await query(
      'SELECT Id FROM Attachments WHERE Id = ?',
      [id]
    );
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }

    // 动态构建更新字段
    const updateFields = [];
    const updateValues = [];
    
    if (contractId !== undefined) {
      updateFields.push('RelatedTable = ?');
      updateFields.push('RelatedId = ?');
      updateValues.push('Contracts');
      updateValues.push(contractId);
    }
    
    if (payableId !== undefined) {
      updateFields.push('RelatedTable = ?');
      updateFields.push('RelatedId = ?');
      updateValues.push('PayableManagement');
      updateValues.push(payableId);
    }
    
    if (paymentId !== undefined) {
      updateFields.push('RelatedTable = ?');
      updateFields.push('RelatedId = ?');
      updateValues.push('PaymentRecords');
      updateValues.push(paymentId);
    }
    
    // 处理从临时状态更新到实际关联
    if (payableId !== undefined || contractId !== undefined || paymentId !== undefined) {
      // 如果当前附件是临时附件，需要更新关联
      const currentAttachment = await query(
        'SELECT RelatedTable, RelatedId FROM Attachments WHERE Id = ?',
        [id]
      );
      
      if (currentAttachment.length > 0 && currentAttachment[0].RelatedTable === 'Temp') {
        console.log('更新临时附件关联');
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE Attachments SET ${updateFields.join(', ')} WHERE Id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: '附件信息更新成功'
    });
  } catch (error) {
    console.error('更新附件信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新附件信息失败'
    });
  }
});

// 删除附件
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取附件信息
    const attachments = await query(
      'SELECT FilePath FROM Attachments WHERE Id = ?',
      [id]
    );
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }

    const attachment = attachments[0];

    // 删除数据库记录
    await query('DELETE FROM Attachments WHERE Id = ?', [id]);

    // 删除物理文件
    try {
      if (fs.existsSync(attachment.FilePath)) {
        fs.unlinkSync(attachment.FilePath);
      }
    } catch (fileError) {
      console.warn('删除物理文件失败:', fileError);
      // 即使物理文件删除失败，也不影响数据库记录的删除
    }
    
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

// 下载附件
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachments = await query(
      'SELECT FileName, FilePath, FileType FROM Attachments WHERE Id = ?',
      [id]
    );
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }

    const attachment = attachments[0];
    
    // 检查文件是否存在
    if (!fs.existsSync(attachment.FilePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 设置响应头
    res.setHeader('Content-Type', attachment.FileType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.FileName)}"`);
    
    // 发送文件
    res.sendFile(path.resolve(attachment.FilePath));
  } catch (error) {
    console.error('下载附件错误:', error);
    res.status(500).json({
      success: false,
      message: '下载附件失败'
    });
  }
});

// 获取付款相关的附件
router.get('/payment/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const attachments = await query(`
      SELECT a.*, pr.PaymentDescription, pm.PayableNumber, c.ContractNumber, c.Title as ContractTitle
      FROM Attachments a
      LEFT JOIN PaymentRecords pr ON a.RelatedTable = 'PaymentRecords' AND a.RelatedId = pr.Id
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      WHERE a.RelatedTable = 'PaymentRecords' AND a.RelatedId = ?
      ORDER BY a.CreatedAt DESC
    `, [paymentId]);
    
    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('获取付款附件错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款附件失败'
    });
  }
});

// 获取应付管理附件
router.get('/payable/:payableId', authenticateToken, async (req, res) => {
  try {
    const { payableId } = req.params;
    
    const attachments = await query(`
      SELECT a.*, pm.PayableNumber, c.ContractNumber, c.Title as ContractTitle
      FROM Attachments a
      LEFT JOIN PayableManagement pm ON a.RelatedTable = 'PayableManagement' AND a.RelatedId = pm.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      WHERE a.RelatedTable = 'PayableManagement' AND a.RelatedId = ?
      ORDER BY a.CreatedAt DESC
    `, [payableId]);
    
    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('获取应付管理附件错误:', error);
    res.status(500).json({
      success: false,
      message: '获取应付管理附件失败'
    });
  }
});

// 获取合同相关的附件
router.get('/contract/:contractId', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const attachments = await query(`
      SELECT a.*, c.ContractNumber, c.Title as ContractTitle
      FROM Attachments a
      LEFT JOIN Contracts c ON a.RelatedTable = 'Contracts' AND a.RelatedId = c.Id
      WHERE a.RelatedTable = 'Contracts' AND a.RelatedId = ?
      ORDER BY a.CreatedAt DESC
    `, [contractId]);
    
    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('获取合同附件错误:', error);
    res.status(500).json({
      success: false,
      message: '获取合同附件失败'
    });
  }
});

// 获取附件统计信息
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as totalAttachments,
        SUM(FileSize) as totalSize,
        COUNT(CASE WHEN RelatedTable = 'PaymentRecords' THEN 1 END) as paymentAttachments,
        COUNT(CASE WHEN RelatedTable = 'Contracts' THEN 1 END) as contractAttachments,
        COUNT(CASE WHEN RelatedTable = 'PayableManagement' THEN 1 END) as payableAttachments
      FROM Attachments
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取附件统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取附件统计信息失败'
    });
  }
});

module.exports = router;
