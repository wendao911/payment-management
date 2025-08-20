const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const router = express.Router();

// 构建树结构的公共函数
const buildTree = (items, parentId = null) => {
  // 确保类型一致性，将parentId转换为数字或null
  const targetParentId = parentId === null ? null : Number(parentId);
  
  const filtered = items.filter(item => {
    // 处理item.ParentContractId可能为null、undefined或数字的情况
    let itemParentId = item.ParentContractId;
    
    // 如果itemParentId是字符串，转换为数字
    if (typeof itemParentId === 'string' && itemParentId !== 'null') {
      itemParentId = Number(itemParentId);
    }
    
    // 如果itemParentId是'null'字符串，转换为null
    if (itemParentId === 'null') {
      itemParentId = null;
    }
    
    // 比较：null === null 或 数字 === 数字
    return itemParentId === targetParentId;
  });
  
  return filtered.map(item => ({
    ...item,
    children: buildTree(items, item.Id)
  }));
};

// 获取所有合同
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('开始获取合同列表...');
    
    // 首先检查数据库连接
    const testQuery = await query('SELECT 1 as test');
    console.log('数据库连接测试成功:', testQuery);
    
    // 检查Contracts表是否存在
    const tablesQuery = await query('SHOW TABLES LIKE "Contracts"');
    console.log('Contracts表检查结果:', tablesQuery);
    
    if (tablesQuery.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Contracts表不存在，请先运行数据库初始化脚本'
      });
    }
    
    const contracts = await query(`
      SELECT 
        c.*,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact
      FROM Contracts c
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      ORDER BY c.CreatedAt DESC
    `);
    
    console.log(`成功获取 ${contracts.length} 个合同`);

         // 为每个合同获取附件信息
     for (let contract of contracts) {
       try {
         const attachments = await query(`
           SELECT Id, FileName, OriginalFileName, FilePath, FileSize, FileType
           FROM Attachments 
           WHERE RelatedTable = 'Contracts' AND RelatedId = ?
           ORDER BY CreatedAt DESC
         `, [contract.Id]);
         contract.attachments = attachments;
       } catch (attachmentError) {
         console.warn(`获取合同 ${contract.Id} 的附件失败:`, attachmentError.message);
         contract.attachments = [];
       }
     }
    
    // 构建树结构
    const treeData = buildTree(contracts);
    
    res.json({
      success: true,
      data: treeData
    });
  } catch (error) {
    console.error('获取合同列表错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '获取合同列表失败';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '数据库连接失败，请检查数据库服务状态';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = '数据库访问被拒绝，请检查用户名和密码';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = '数据库不存在，请先创建数据库';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = '数据表不存在，请先运行数据库初始化脚本';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 搜索合同
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { contractNumber, title, supplierId, status, startDate, endDate, minAmount, maxAmount } = req.query;
    
    let sql = `
      SELECT 
        c.*,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact
      FROM Contracts c
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      WHERE 1=1
    `;
    const params = [];
    
    if (contractNumber) {
      sql += ` AND c.ContractNumber LIKE ?`;
      params.push(`%${contractNumber}%`);
    }
    
    if (title) {
      sql += ` AND c.Title LIKE ?`;
      params.push(`%${title}%`);
    }
    
    if (supplierId) {
      sql += ` AND c.SupplierId = ?`;
      params.push(supplierId);
    }
    
    if (status) {
      sql += ` AND c.Status = ?`;
      params.push(status);
    }
    
    if (startDate && endDate) {
      sql += ` AND c.ContractDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    if (minAmount && maxAmount) {
      sql += ` AND c.TotalAmount BETWEEN ? AND ?`;
      params.push(parseFloat(minAmount), parseFloat(maxAmount));
    }
    
    sql += ` ORDER BY c.CreatedAt DESC`;
    
    const contracts = await query(sql, params);
    
         // 为每个合同获取附件信息
     for (let contract of contracts) {
       try {
         const attachments = await query(`
           SELECT Id, FileName, OriginalFileName, FilePath, FileSize, FileType
           FROM Attachments 
           WHERE RelatedTable = 'Contracts' AND RelatedId = ?
           ORDER BY CreatedAt DESC
         `, [contract.Id]);
         contract.attachments = attachments;
       } catch (attachmentError) {
         console.warn(`获取合同 ${contract.Id} 的附件失败:`, attachmentError.message);
         contract.attachments = [];
       }
     }
    
    // 构建树结构
    const treeData = buildTree(contracts);
    
    res.json({
      success: true,
      data: treeData
    });
  } catch (error) {
    console.error('搜索合同错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索合同失败'
    });
  }
});

// 获取单个合同
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const contracts = await query(`
      SELECT 
        c.*,
        s.Name as SupplierName,
        s.ContactPerson as SupplierContact,
        s.Phone as SupplierPhone,
        s.Email as SupplierEmail
      FROM Contracts c
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      WHERE c.Id = ?
    `, [id]);
    
    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }
    
    res.json({
      success: true,
      data: contracts[0]
    });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取合同详情失败'
    });
  }
});

// 创建合同
router.post('/', authenticateToken, [
  body('ContractNumber').notEmpty().withMessage('合同编号不能为空'),
  body('Title').notEmpty().withMessage('合同标题不能为空'),
  body('Description').optional(),
  body('ContractDate').optional(),
  body('StartDate').optional(),
  body('EndDate').optional(),
  body('Status').optional().isIn(['active', 'completed', 'terminated', 'draft']),
  body('SupplierId').isInt({ min: 1 }).withMessage('供应商ID无效'),
  body('ParentContractId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // 允许null/undefined/空字符串
    }
    if (Number.isInteger(Number(value)) && Number(value) >= 1) {
      return true; // 允许有效的正整数
    }
    throw new Error('父合同ID必须是有效的正整数');
  }),
  body('TotalAmount').optional().isFloat({ min: 0 }).withMessage('合同金额必须是非负数')
], async (req, res) => {
  try {
    console.log('收到创建合同请求:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const {
      ContractNumber, Title, Description, ContractDate,
      StartDate, EndDate, Status, ParentContractId, SupplierId, TotalAmount
    } = req.body;

    console.log('解析后的数据:', {
      ContractNumber, Title, Description, ContractDate,
      StartDate, EndDate, Status, ParentContractId, SupplierId, TotalAmount
    });

    // 检查合同编号是否已存在
    const existingContracts = await query(
      'SELECT Id FROM Contracts WHERE ContractNumber = ?',
      [ContractNumber]
    );
    
    if (existingContracts.length > 0) {
      return res.status(400).json({
        success: false,
        message: '合同编号已存在'
      });
    }

    // 检查供应商是否存在
    const suppliers = await query(
      'SELECT Id FROM Suppliers WHERE Id = ?',
      [SupplierId]
    );
    
    if (suppliers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '供应商不存在'
      });
    }

    // 如果有父合同，检查父合同是否存在
    if (ParentContractId) {
      const parentContracts = await query(
        'SELECT Id FROM Contracts WHERE Id = ?',
        [ParentContractId]
      );
      
      if (parentContracts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '父合同不存在'
        });
      }
    }

    // 处理日期字段，允许null值
    const contractDate = ContractDate;
    const contractAmount = TotalAmount || 0;

    // 处理undefined值，转换为null
    const startDate = StartDate || null;
    const endDate = EndDate || null;
    const parentContractId = ParentContractId || null;
    const description = Description || null;

    console.log('准备插入的数据:', {
      ContractNumber, Title, Description: description, TotalAmount: contractAmount, 
      ContractDate: contractDate, StartDate: startDate, EndDate: endDate, Status: Status || 'active', 
      ParentContractId: parentContractId, SupplierId
    });

    const result = await query(`
      INSERT INTO Contracts (
        ContractNumber, Title, Description, TotalAmount, ContractDate,
        StartDate, EndDate, Status, ParentContractId, SupplierId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [ContractNumber, Title, description, contractAmount, contractDate, 
        startDate, endDate, Status || 'active', parentContractId, SupplierId]);

    console.log('插入成功，结果:', result);

    res.status(201).json({
      success: true,
      message: '合同创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建合同错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '创建合同失败',
      error: error.message
    });
  }
});

// 更新合同
router.put('/:id', authenticateToken, [
  body('ContractNumber').optional().notEmpty().withMessage('合同编号不能为空'),
  body('Title').optional().notEmpty().withMessage('合同标题不能为空'),
  body('Description').optional(),
  body('ContractDate').optional(),
  body('StartDate').optional(),
  body('EndDate').optional(),
  body('Status').optional().isIn(['active', 'completed', 'terminated', 'draft']),
  body('SupplierId').optional().isInt({ min: 1 }).withMessage('供应商ID无效'),
  body('ParentContractId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // 允许null/undefined/空字符串
    }
    if (Number.isInteger(Number(value)) && Number(value) >= 1) {
      return true; // 允许有效的正整数
    }
    throw new Error('父合同ID必须是有效的正整数');
  }),
  body('TotalAmount').optional().isFloat({ min: 0 }).withMessage('合同金额必须是非负数')
], async (req, res) => {
  try {
    console.log('收到更新合同请求:', { id: req.params.id, body: req.body });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    console.log('更新数据:', updateData);
    
    // 检查合同是否存在
    const existingContracts = await query(
      'SELECT Id FROM Contracts WHERE Id = ?',
      [id]
    );
    
    if (existingContracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 如果更新合同编号，检查是否与其他合同重复
    if (updateData.ContractNumber) {
      const duplicateContracts = await query(
        'SELECT Id FROM Contracts WHERE ContractNumber = ? AND Id != ?',
        [updateData.ContractNumber, id]
      );
      
      if (duplicateContracts.length > 0) {
        return res.status(400).json({
          success: false,
          message: '合同编号已存在'
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

    console.log('更新SQL:', `UPDATE Contracts SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?`);
    console.log('更新参数:', values);

    await query(
      `UPDATE Contracts SET ${setClause}, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?`,
      values
    );

    console.log('更新成功');
    res.json({
      success: true,
      message: '合同更新成功'
    });
  } catch (error) {
    console.error('更新合同错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '更新合同失败',
      error: error.message
    });
  }
});

// 删除合同
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
         // 检查是否有关联的应付管理记录
     const payables = await query(
       'SELECT COUNT(*) as count FROM PayableManagement WHERE ContractId = ?',
       [id]
     );
     
     if (payables[0].count > 0) {
       return res.status(400).json({
         success: false,
         message: '无法删除：该合同有关联的应付管理记录'
       });
     }

    // 检查是否有子合同
    const childContracts = await query(
      'SELECT COUNT(*) as count FROM Contracts WHERE ParentContractId = ?',
      [id]
    );
    
    if (childContracts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除：该合同有子合同'
      });
    }

    await query('DELETE FROM Contracts WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: '合同删除成功'
    });
  } catch (error) {
    console.error('删除合同错误:', error);
    res.status(500).json({
      success: false,
      message: '删除合同失败'
    });
  }
});

// 上传合同文件
router.post('/:id/upload', authenticateToken, upload.single('contract'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    // 检查合同是否存在
    const contracts = await query(
      'SELECT Id FROM Contracts WHERE Id = ?',
      [id]
    );
    
    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 更新合同文件路径
    await query(
      'UPDATE Contracts SET ContractTextPath = ?, UpdatedAt = CURRENT_TIMESTAMP(6) WHERE Id = ?',
      [req.file.path, id]
    );

    res.json({
      success: true,
      message: '合同文件上传成功',
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      }
    });
  } catch (error) {
    console.error('上传合同文件错误:', error);
    res.status(500).json({
      success: false,
      message: '上传合同文件失败'
    });
  }
});

// 获取合同统计信息
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as totalContracts,
        SUM(TotalAmount) as totalAmount,
        COUNT(CASE WHEN Status = 'active' THEN 1 END) as activeContracts,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedContracts
      FROM Contracts
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取合同统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取合同统计信息失败'
    });
  }
});

module.exports = router;
