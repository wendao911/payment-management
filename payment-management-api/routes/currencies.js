const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有币种
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currencies = await query(`
      SELECT * FROM currencies 
      WHERE IsActive = TRUE
      ORDER BY Code ASC
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

// 获取单个币种
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currencies = await query(`
      SELECT * FROM currencies 
      WHERE Id = ? AND IsActive = TRUE
    `, [id]);
    
    if (currencies.length === 0) {
      return res.status(404).json({
        success: false,
        message: '币种不存在'
      });
    }
    
    res.json({
      success: true,
      data: currencies[0]
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
    const { code, name, isActive } = req.query;
    
    let sql = `SELECT * FROM currencies WHERE 1=1`;
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
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    sql += ` ORDER BY Code ASC`;
    
    const currencies = await query(sql, params);
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('搜索币种错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索币种失败'
    });
  }
});

module.exports = router;
