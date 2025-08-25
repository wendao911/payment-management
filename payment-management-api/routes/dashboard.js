const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 银行账户汇总（统一美元）
router.get('/bank-accounts/summary', authenticateToken, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        ba.Id,
        ba.AccountName,
        b.BankName,
        ba.CurrencyCode,
        ba.CurrentBalance,
        COALESCE(SUM(CASE WHEN bab.BalanceStatus = 'Available' THEN bab.Balance END), 0) AS AvailableBalance,
        COALESCE(SUM(CASE WHEN bab.BalanceStatus = 'Unavailable' THEN bab.Balance END), 0) AS UnavailableBalance,
        cur.ExchangeRate
      FROM BankAccounts ba
      LEFT JOIN Banks b ON ba.BankId = b.Id
      LEFT JOIN BankAccountBalances bab ON bab.BankAccountId = ba.Id
      LEFT JOIN Currencies cur ON ba.CurrencyCode = cur.Code
      WHERE ba.IsActive = TRUE
      GROUP BY ba.Id, ba.AccountName, b.BankName, ba.CurrencyCode, ba.CurrentBalance, cur.ExchangeRate
      ORDER BY ba.AccountName ASC
    `);

    const items = rows.map((r) => {
      const exchangeRate = Number(r.ExchangeRate || 1);
      // 若未录入明细余额，则使用当前余额作为可用余额
      const available = Number(r.AvailableBalance || 0);
      const unavailable = Number(r.UnavailableBalance || 0);
      const hasBreakdown = available > 0 || unavailable > 0;
      const total = Number(r.CurrentBalance || 0);
      const finalAvailable = hasBreakdown ? available : total;
      const finalUnavailable = hasBreakdown ? unavailable : 0;
      const toUsd = (amt) => Number((Number(amt || 0) / (exchangeRate || 1)).toFixed(2));
      return {
        accountId: r.Id,
        accountName: r.AccountName,
        bankName: r.BankName,
        currencyCode: r.CurrencyCode,
        exchangeRate,
        total,
        available: finalAvailable,
        unavailable: finalUnavailable,
        totalUsd: toUsd(total),
        availableUsd: toUsd(finalAvailable),
        unavailableUsd: toUsd(finalUnavailable)
      };
    });

    const aggregate = items.reduce((acc, i) => {
      acc.totalUsd += i.totalUsd;
      acc.availableUsd += i.availableUsd;
      acc.unavailableUsd += i.unavailableUsd;
      return acc;
    }, { totalUsd: 0, availableUsd: 0, unavailableUsd: 0 });

    Object.keys(aggregate).forEach(k => {
      aggregate[k] = Number(aggregate[k].toFixed(2));
    });

    res.json({ success: true, data: { items, aggregate } });
  } catch (error) {
    console.error('获取银行账户汇总错误:', error);
    res.status(500).json({ success: false, message: '获取银行账户汇总失败' });
  }
});

// 应付汇总：紧急与逾期（统一美元）
router.get('/payables/summary', authenticateToken, async (req, res) => {
  try {
    // 合并查询紧急和逾期的应付
    const payablesRows = await query(`
      SELECT 
        pm.Id,
        pm.PayableNumber,
        pm.PayableAmount,
        pm.CurrencyCode,
        pm.PaymentDueDate,
        pm.Importance,
        pm.Urgency,
        pm.Status,
        pm.Description AS PayableDescription,
        s.Name AS SupplierName,
        c.ContractNumber,
        c.Title AS ContractTitle,
        cur.ExchangeRate,
        CASE 
          WHEN pm.PaymentDueDate < CURDATE() AND pm.Status != 'completed' THEN 'overdue'
          WHEN pm.PaymentDueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND pm.Status != 'completed' THEN 'urgent'
          ELSE 'normal'
        END AS WarningStatus
      FROM PayableManagement pm
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE (pm.PaymentDueDate < CURDATE() AND pm.Status != 'completed')
         OR (pm.PaymentDueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND pm.Status != 'completed')
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC
    `);

    // 为每个应付查询其付款记录和汇率
    const payables = await Promise.all(payablesRows.map(async (r) => {
      try {
        // 查询该应付的所有付款记录
        const paymentRecords = await query(`
          SELECT 
            pr.PaymentAmount,
            pr.CurrencyCode,
            cur.ExchangeRate
          FROM PaymentRecords pr
          LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
          WHERE pr.PayableManagementId = ?
        `, [r.Id]);

        // 计算已付金额（需要按币种分别换算）
        let totalPaidAmountUsd = 0;
        let totalPaidAmount = 0;
        
        paymentRecords.forEach(pr => {
          const amount = Number(pr.PaymentAmount || 0);
          const rate = Number(pr.ExchangeRate || 1);
          totalPaidAmount += amount;
          totalPaidAmountUsd += amount / rate;
        });

        const payableRate = Number(r.ExchangeRate || 1);
        const payableAmountUsd = Number(r.PayableAmount || 0) / payableRate;
        const remainingAmount = Math.max(0, Number(r.PayableAmount || 0) - totalPaidAmount);
        const remainingAmountUsd = Math.max(0, payableAmountUsd - totalPaidAmountUsd);
        
        return {
          id: r.Id,
          payableNumber: r.PayableNumber,
          payableDescription: r.PayableDescription || '',
          supplierName: r.SupplierName || '',
          contractNumber: r.ContractNumber || '',
          contractTitle: r.ContractTitle || '',
          contractDisplay: `${r.ContractNumber || ''}-${r.ContractTitle || ''}`.replace(/^-/, ''),
          payableAmount: Number(r.PayableAmount || 0),
          payableAmountDisplay: `${r.CurrencyCode || 'CNY'} ${Number(r.PayableAmount || 0).toLocaleString()}`,
          totalPaidAmount: totalPaidAmount,
          remainingAmount: remainingAmount,
          currencyCode: r.CurrencyCode || 'CNY',
          paymentDueDate: r.PaymentDueDate,
          importance: r.Importance || 'normal',
          urgency: r.Urgency || 'normal',
          status: r.Status || 'pending',
          warningStatus: r.WarningStatus || 'normal',
          // USD 换算
          payableAmountUsd: Number(payableAmountUsd.toFixed(2)),
          totalPaidAmountUsd: Number(totalPaidAmountUsd.toFixed(2)),
          remainingAmountUsd: Number(remainingAmountUsd.toFixed(2))
        };
      } catch (error) {
        console.error(`处理应付记录 ${r.Id} 时出错:`, error);
        // 返回默认值，避免整个请求失败
        return {
          id: r.Id,
          payableNumber: r.PayableNumber || '',
          payableDescription: r.PayableDescription || '',
          supplierName: r.SupplierName || '',
          contractNumber: r.ContractNumber || '',
          contractTitle: r.ContractTitle || '',
          contractDisplay: `${r.ContractNumber || ''}-${r.ContractTitle || ''}`.replace(/^-/, ''),
          payableAmount: Number(r.PayableAmount || 0),
          payableAmountDisplay: `${r.CurrencyCode || 'CNY'} ${Number(r.PayableAmount || 0).toLocaleString()}`,
          totalPaidAmount: 0,
          remainingAmount: Number(r.PayableAmount || 0),
          currencyCode: r.CurrencyCode || 'CNY',
          paymentDueDate: r.PaymentDueDate,
          importance: r.Importance || 'normal',
          urgency: r.Urgency || 'normal',
          status: r.Status || 'pending',
          warningStatus: r.WarningStatus || 'normal',
          payableAmountUsd: 0,
          totalPaidAmountUsd: 0,
          remainingAmountUsd: 0
        };
      }
    }));

    // 按状态分组统计
    const urgentCount = payables.filter(p => p.warningStatus === 'urgent').length;
    const overdueCount = payables.filter(p => p.warningStatus === 'overdue').length;
    const urgentTotalUsd = payables.filter(p => p.warningStatus === 'urgent')
      .reduce((sum, p) => sum + p.remainingAmountUsd, 0);
    const overdueTotalUsd = payables.filter(p => p.warningStatus === 'overdue')
      .reduce((sum, p) => sum + p.remainingAmountUsd, 0);

    res.json({ 
      success: true, 
      data: { 
        payables,
        summary: {
          urgent: { count: urgentCount, totalUsd: Number(urgentTotalUsd.toFixed(2)) },
          overdue: { count: overdueCount, totalUsd: Number(overdueTotalUsd.toFixed(2)) }
        }
      } 
    });
  } catch (error) {
    console.error('获取应付汇总错误:', error);
    res.status(500).json({ success: false, message: '获取应付汇总失败' });
  }
});

// 付款记录汇总：支持按日/月/年筛选（统一美元）
router.get('/payment-records/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, granularity } = req.query;

    // 默认时间范围：最近30天
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    const start = startDate || defaultStart.toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    // 列表（时间范围内的付款记录）
    const payments = await query(`
      SELECT 
        pr.Id,
        pr.PaymentNumber,
        pr.PayableManagementId,
        pr.CurrencyCode,
        pr.PaymentDescription,
        pr.PaymentAmount,
        pr.PaymentDate,
        pm.PayableNumber,
        s.Name AS SupplierName,
        c.ContractNumber,
        cur.ExchangeRate
      FROM PaymentRecords pr
      LEFT JOIN PayableManagement pm ON pr.PayableManagementId = pm.Id
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      WHERE pr.PaymentDate BETWEEN ? AND ?
      ORDER BY pr.PaymentDate DESC
    `, [start, end]);

    const paymentItems = payments.map(r => {
      const rate = Number(r.ExchangeRate || 1);
      const toUsd = (amt) => Number((Number(amt || 0) / (rate || 1)).toFixed(2));
      return {
        id: r.Id,
        paymentNumber: r.PaymentNumber,
        payableManagementId: r.PayableManagementId,
        payableNumber: r.PayableNumber,
        supplierName: r.SupplierName,
        contractNumber: r.ContractNumber,
        paymentAmount: Number(r.PaymentAmount || 0),
        currencyCode: r.CurrencyCode,
        paymentAmountUsd: toUsd(r.PaymentAmount),
        paymentDate: r.PaymentDate,
        paymentDescription: r.PaymentDescription
      };
    });

    // 按应付聚合（时间范围内 和 累计）
    const byPayable = await query(`
      SELECT 
        pm.Id AS PayableId,
        pm.PayableNumber,
        pm.CurrencyCode AS PayableCurrencyCode,
        cur.ExchangeRate AS PayableExchangeRate
      FROM PayableManagement pm
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      ORDER BY pm.Id
    `);

    // 为每个应付查询其付款记录，并按币种分别计算
    const groupedByPayable = await Promise.all(byPayable.map(async (payable) => {
      try {
        // 查询该应付的所有付款记录，按币种分组
        const paymentRecordsByCurrency = await query(`
          SELECT 
            pr.CurrencyCode,
            cur.ExchangeRate,
            COALESCE(SUM(CASE WHEN pr.PaymentDate BETWEEN ? AND ? THEN pr.PaymentAmount END), 0) AS SumInRange,
            COALESCE(SUM(pr.PaymentAmount), 0) AS SumAllTime
          FROM PaymentRecords pr
          LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
          WHERE pr.PayableManagementId = ?
          GROUP BY pr.CurrencyCode, cur.ExchangeRate
        `, [start, end, payable.PayableId]);

        // 计算各币种的USD金额
        let sumInRangeUsd = 0;
        let sumAllTimeUsd = 0;

        paymentRecordsByCurrency.forEach(record => {
          const rate = Number(record.ExchangeRate || 1);
          const inRange = Number(record.SumInRange || 0);
          const allTime = Number(record.SumAllTime || 0);
          
          sumInRangeUsd += inRange / rate;
          sumAllTimeUsd += allTime / rate;
        });

        return {
          payableId: payable.PayableId,
          payableNumber: payable.PayableNumber,
          payableCurrencyCode: payable.PayableCurrencyCode,
          sumInRangeUsd: Number(sumInRangeUsd.toFixed(2)),
          sumAllTimeUsd: Number(sumAllTimeUsd.toFixed(2)),
          // 添加原始币种金额，用于调试
          paymentRecordsByCurrency: paymentRecordsByCurrency.map(record => ({
            currencyCode: record.CurrencyCode,
            exchangeRate: record.ExchangeRate,
            sumInRange: Number(record.SumInRange || 0),
            sumAllTime: Number(record.SumAllTime || 0)
          }))
        };
      } catch (error) {
        console.error(`处理应付 ${payable.PayableId} 的付款记录时出错:`, error);
        return {
          payableId: payable.PayableId,
          payableNumber: payable.PayableNumber,
          payableCurrencyCode: payable.PayableCurrencyCode,
          sumInRangeUsd: 0,
          sumAllTimeUsd: 0,
          paymentRecordsByCurrency: []
        };
      }
    }));

    // 总计（时间范围内）- 使用已计算的 paymentItems
    const totalUsd = paymentItems.reduce((acc, i) => acc + i.paymentAmountUsd, 0);

    // 验证：重新计算总计，确保汇率换算正确
    const totalUsdVerification = await query(`
      SELECT 
        pr.CurrencyCode,
        cur.ExchangeRate,
        SUM(pr.PaymentAmount) AS totalAmount
      FROM PaymentRecords pr
      LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
      WHERE pr.PaymentDate BETWEEN ? AND ?
      GROUP BY pr.CurrencyCode, cur.ExchangeRate
    `, [start, end]);

    let totalUsdRecalculated = 0;
    totalUsdVerification.forEach(row => {
      const amount = Number(row.totalAmount || 0);
      const rate = Number(row.ExchangeRate || 1);
      totalUsdRecalculated += amount / rate;
    });

    console.log('付款记录汇总汇率换算验证:', {
      originalTotal: totalUsd,
      recalculatedTotal: Number(totalUsdRecalculated.toFixed(2)),
      currencyBreakdown: totalUsdVerification.map(row => ({
        currency: row.CurrencyCode,
        amount: Number(row.totalAmount || 0),
        rate: Number(row.ExchangeRate || 1),
        amountUsd: Number((Number(row.totalAmount || 0) / Number(row.ExchangeRate || 1)).toFixed(2))
      }))
    });

    // 可选的时间序列（按日/月/年）
    let timeseries = [];
    if (granularity === 'day' || granularity === 'month' || granularity === 'year') {
      const fmt = granularity === 'day' ? '%Y-%m-%d' : (granularity === 'month' ? '%Y-%m' : '%Y');
      const rows = await query(`
        SELECT 
          DATE_FORMAT(pr.PaymentDate, '${granularity === 'year' ? '%Y' : granularity === 'month' ? '%Y-%m' : '%Y-%m-%d'}') AS period,
          pr.CurrencyCode,
          cur.ExchangeRate,
          SUM(pr.PaymentAmount) AS totalAmount
        FROM PaymentRecords pr
        LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
        WHERE pr.PaymentDate BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(pr.PaymentDate, '${granularity === 'year' ? '%Y' : granularity === 'month' ? '%Y-%m' : '%Y-%m-%d'}'), pr.CurrencyCode, cur.ExchangeRate
        ORDER BY period, pr.CurrencyCode
      `, [start, end]);
      
      // 按时间段聚合，正确处理多币种
      const periodMap = new Map();
      rows.forEach(row => {
        const period = row.period;
        const amount = Number(row.totalAmount || 0);
        const rate = Number(row.ExchangeRate || 1);
        const amountUsd = amount / rate;
        
        if (!periodMap.has(period)) {
          periodMap.set(period, { period, totalUsd: 0 });
        }
        periodMap.get(period).totalUsd += amountUsd;
      });
      
      timeseries = Array.from(periodMap.values()).map(item => ({
        period: item.period,
        totalUsd: Number(item.totalUsd.toFixed(2))
      }));
    }

    res.json({
      success: true,
      data: {
        range: { start, end },
        totalPaidUsd: Number(totalUsd.toFixed(2)),
        payments: paymentItems,
        groupedByPayable,
        timeseries,
      }
    });
  } catch (error) {
    console.error('获取付款记录汇总错误:', error);
    res.status(500).json({ success: false, message: '获取付款记录汇总失败' });
  }
});

// 获取付款预警信息
router.get('/warnings', authenticateToken, async (req, res) => {
  try {
    const warnings = [];

    // 检查即将到期的付款（7天内）
    const upcomingWarnings = await query(`
      SELECT 
        p.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        DATEDIFF(p.PaymentDueDate, NOW()) as daysUntilDue,
        p.PayableAmount as totalAmount,
        COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) as payableAmount,
        IFNULL(pr.totalPaid, 0) as totalPaid
      FROM payablemanagement p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.PaymentDueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
      ORDER BY p.PaymentDueDate ASC, p.Importance DESC
    `);

    if (upcomingWarnings.length > 0) {
      warnings.push({
        type: 'upcoming',
        title: '即将到期的付款',
        count: upcomingWarnings.length,
        items: upcomingWarnings,
        severity: 'warning'
      });
    }

    // 检查逾期付款
    const overdueWarnings = await query(`
      SELECT 
        p.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        DATEDIFF(NOW(), p.PaymentDueDate) as daysOverdue,
        p.PayableAmount as totalAmount,
        COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) as payableAmount,
        IFNULL(pr.totalPaid, 0) as totalPaid
      FROM payablemanagement p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.PaymentDueDate < NOW() AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
      ORDER BY p.PaymentDueDate ASC, p.Importance DESC
    `);

    if (overdueWarnings.length > 0) {
      warnings.push({
        type: 'overdue',
        title: '逾期付款',
        count: overdueWarnings.length,
        items: overdueWarnings,
        severity: 'error'
      });
    }

    // 检查重要付款
    const importantWarnings = await query(`
      SELECT 
        p.*,
        c.ContractNumber,
        c.Title as ContractTitle,
        s.Name as SupplierName,
        p.PayableAmount as totalAmount,
        COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) as payableAmount,
        IFNULL(pr.totalPaid, 0) as totalPaid
      FROM payablemanagement p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.Importance = 'important' AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
      ORDER BY p.PaymentDueDate ASC
    `);

    if (importantWarnings.length > 0) {
      warnings.push({
        type: 'important',
        title: '重要付款提醒',
        count: importantWarnings.length,
        items: importantWarnings,
        severity: 'info'
      });
    }

    // 检查合同即将到期（30天内）
    const contractWarnings = await query(`
      SELECT 
        c.*,
        s.Name as SupplierName,
        DATEDIFF(c.EndDate, NOW()) as daysUntilExpiry
      FROM Contracts c
      LEFT JOIN Suppliers s ON c.SupplierId = s.Id
      WHERE c.EndDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
        AND c.Status = 'Active'
      ORDER BY c.EndDate ASC
    `);

    if (contractWarnings.length > 0) {
      warnings.push({
        type: 'contract',
        title: '合同即将到期',
        count: contractWarnings.length,
        items: contractWarnings,
        severity: 'warning'
      });
    }

    res.json({
      success: true,
      data: warnings
    });
  } catch (error) {
    console.error('获取付款预警信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款预警信息失败'
    });
  }
});

// 获取付款预警统计信息
router.get('/payment-warnings-summary', authenticateToken, async (req, res) => {
  try {
    // 统计7天内到期的付款
    const upcomingCount = await query(`
      SELECT COUNT(*) as count
      FROM payablemanagement p
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.PaymentDueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
    `);

    // 统计逾期付款
    const overdueCount = await query(`
      SELECT COUNT(*) as count
      FROM payablemanagement p
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.PaymentDueDate < NOW() AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
    `);

    // 统计重要付款
    const importantCount = await query(`
      SELECT COUNT(*) as count
      FROM payablemanagement p
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.Importance = 'important' AND p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
    `);

    // 计算总应付金额
    const totalPayable = await query(`
      SELECT 
        SUM(COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount)) as totalAmount
      FROM payablemanagement p
      LEFT JOIN (
        SELECT 
          PayableManagementId,
          SUM(PaymentAmount) as totalPaid
        FROM paymentrecords
        WHERE PayableManagementId IS NOT NULL
        GROUP BY PayableManagementId
      ) pr ON p.Id = pr.PayableManagementId
      WHERE p.Status != 'completed'
        AND COALESCE(p.PayableAmount - IFNULL(pr.totalPaid, 0), p.PayableAmount) > 0
    `);

    res.json({
      success: true,
      data: {
        upcoming: upcomingCount[0]?.count || 0,
        overdue: overdueCount[0]?.count || 0,
        important: importantCount[0]?.count || 0,
        totalPayable: totalPayable[0]?.totalAmount || 0
      }
    });
  } catch (error) {
    console.error('获取付款预警统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取付款预警统计信息失败'
    });
  }
});

// 获取图表数据
router.get('/charts', authenticateToken, async (req, res) => {
  try {
    const { type, period } = req.query;

    let chartData = {};

    switch (type) {
      case 'payment-trend':
        // 获取付款趋势数据
        const trendData = await query(`
          SELECT 
            DATE_FORMAT(PaymentDueDate, '%Y-%m') as month,
            COUNT(*) as count,
            SUM(TotalAmount) as totalAmount,
            SUM(PaidAmount) as totalPaid
          FROM Payments
          WHERE PaymentDueDate >= DATE_SUB(NOW(), INTERVAL ${period || 12} MONTH)
          GROUP BY DATE_FORMAT(PaymentDueDate, '%Y-%m')
          ORDER BY month
        `);
        chartData = trendData;
        break;

      case 'payment-status':
        // 获取付款状态分布
        const statusData = await query(`
          SELECT 
            Status,
            COUNT(*) as count,
            SUM(TotalAmount) as totalAmount
          FROM Payments
          GROUP BY Status
        `);
        chartData = statusData;
        break;

      case 'importance-distribution':
        // 获取重要程度分布
        const importanceData = await query(`
          SELECT 
            Importance,
            COUNT(*) as count,
            SUM(TotalAmount) as totalAmount
          FROM Payments
          GROUP BY Importance
          ORDER BY Importance DESC
        `);
        chartData = importanceData;
        break;

      case 'supplier-analysis':
        // 获取供应商分析数据
        const supplierData = await query(`
          SELECT 
            s.Name as SupplierName,
            COUNT(p.Id) as paymentCount,
            SUM(p.TotalAmount) as totalAmount,
            SUM(p.PaidAmount) as totalPaid
          FROM Suppliers s
          LEFT JOIN Payments p ON s.Id = p.SupplierId
          GROUP BY s.Id, s.Name
          HAVING paymentCount > 0
          ORDER BY totalAmount DESC
          LIMIT 10
        `);
        chartData = supplierData;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '无效的图表类型'
        });
    }

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('获取图表数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图表数据失败'
    });
  }
});

module.exports = router;
