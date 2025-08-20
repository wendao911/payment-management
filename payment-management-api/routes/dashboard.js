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
    const urgentRows = await query(`
      SELECT 
        pm.Id,
        pm.PayableNumber,
        pm.PayableAmount,
        pm.CurrencyCode,
        pm.PaymentDueDate,
        pm.Importance,
        pm.Urgency,
        pm.Status,
        s.Name AS SupplierName,
        c.ContractNumber,
        COALESCE(SUM(pr.PaymentAmount), 0) AS TotalPaidAmount,
        cur.ExchangeRate
      FROM PayableManagement pm
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN PaymentRecords pr ON pr.PayableManagementId = pm.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE pm.Urgency IN ('urgent', 'very_urgent') AND pm.Status != 'completed'
      GROUP BY pm.Id, pm.PayableNumber, pm.PayableAmount, pm.CurrencyCode, pm.PaymentDueDate, pm.Importance, pm.Urgency, pm.Status, s.Name, c.ContractNumber, cur.ExchangeRate
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC
    `);

    const overdueRows = await query(`
      SELECT 
        pm.Id,
        pm.PayableNumber,
        pm.PayableAmount,
        pm.CurrencyCode,
        pm.PaymentDueDate,
        pm.Importance,
        pm.Urgency,
        pm.Status,
        s.Name AS SupplierName,
        c.ContractNumber,
        COALESCE(SUM(pr.PaymentAmount), 0) AS TotalPaidAmount,
        cur.ExchangeRate
      FROM PayableManagement pm
      LEFT JOIN Suppliers s ON pm.SupplierId = s.Id
      LEFT JOIN Contracts c ON pm.ContractId = c.Id
      LEFT JOIN PaymentRecords pr ON pr.PayableManagementId = pm.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      WHERE (pm.Status = 'overdue' OR (pm.PaymentDueDate < NOW() AND pm.Status != 'completed'))
      GROUP BY pm.Id, pm.PayableNumber, pm.PayableAmount, pm.CurrencyCode, pm.PaymentDueDate, pm.Importance, pm.Urgency, pm.Status, s.Name, c.ContractNumber, cur.ExchangeRate
      ORDER BY pm.PaymentDueDate ASC, pm.Importance DESC
    `);

    const mapUsd = (rows) => rows.map(r => {
      const rate = Number(r.ExchangeRate || 1);
      const toUsd = (amt) => Number((Number(amt || 0) / (rate || 1)).toFixed(2));
      const paid = Number(r.TotalPaidAmount || 0);
      const remaining = Number(r.PayableAmount || 0) - paid;
      return {
        id: r.Id,
        payableNumber: r.PayableNumber,
        supplierName: r.SupplierName,
        contractNumber: r.ContractNumber,
        payableAmount: Number(r.PayableAmount || 0),
        totalPaidAmount: paid,
        remainingAmount: remaining,
        currencyCode: r.CurrencyCode,
        paymentDueDate: r.PaymentDueDate,
        importance: r.Importance,
        urgency: r.Urgency,
        status: r.Status,
        payableAmountUsd: toUsd(r.PayableAmount),
        totalPaidAmountUsd: toUsd(paid),
        remainingAmountUsd: toUsd(remaining)
      };
    });

    const urgent = mapUsd(urgentRows);
    const overdue = mapUsd(overdueRows);

    res.json({ success: true, data: { urgent, overdue } });
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
        pm.CurrencyCode,
        cur.ExchangeRate,
        COALESCE(SUM(CASE WHEN pr.PaymentDate BETWEEN ? AND ? THEN pr.PaymentAmount END), 0) AS SumInRange,
        COALESCE(SUM(pr.PaymentAmount), 0) AS SumAllTime
      FROM PayableManagement pm
      LEFT JOIN PaymentRecords pr ON pr.PayableManagementId = pm.Id
      LEFT JOIN Currencies cur ON pm.CurrencyCode = cur.Code
      GROUP BY pm.Id, pm.PayableNumber, pm.CurrencyCode, cur.ExchangeRate
      ORDER BY SumInRange DESC
    `, [start, end]);

    const groupedByPayable = byPayable.map(r => {
      const rate = Number(r.ExchangeRate || 1);
      const toUsd = (amt) => Number((Number(amt || 0) / (rate || 1)).toFixed(2));
      return {
        payableId: r.PayableId,
        payableNumber: r.PayableNumber,
        sumInRangeUsd: toUsd(r.SumInRange),
        sumAllTimeUsd: toUsd(r.SumAllTime),
        currencyCode: r.CurrencyCode
      };
    });

    // 总计（时间范围内）
    const totalUsd = paymentItems.reduce((acc, i) => acc + i.paymentAmountUsd, 0);

    // 可选的时间序列（按日/月/年）
    let timeseries = [];
    if (granularity === 'day' || granularity === 'month' || granularity === 'year') {
      const fmt = granularity === 'day' ? '%Y-%m-%d' : (granularity === 'month' ? '%Y-%m' : '%Y');
      const rows = await query(`
        SELECT 
          DATE_FORMAT(pr.PaymentDate, '${granularity === 'year' ? '%Y' : granularity === 'month' ? '%Y-%m' : '%Y-%m-%d'}') AS period,
          SUM(pr.PaymentAmount / NULLIF(cur.ExchangeRate, 0)) AS totalUsd
        FROM PaymentRecords pr
        LEFT JOIN Currencies cur ON pr.CurrencyCode = cur.Code
        WHERE pr.PaymentDate BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(pr.PaymentDate, '${granularity === 'year' ? '%Y' : granularity === 'month' ? '%Y-%m' : '%Y-%m-%d'}')
        ORDER BY period
      `, [start, end]);
      timeseries = rows.map(r => ({ period: r.period, totalUsd: Number(Number(r.totalUsd || 0).toFixed(2)) }));
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
        DATEDIFF(p.PaymentDueDate, NOW()) as daysUntilDue
      FROM Payments p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      WHERE p.PaymentDueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND p.Status != 2
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
        DATEDIFF(NOW(), p.PaymentDueDate) as daysOverdue
      FROM Payments p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      WHERE p.PaymentDueDate < NOW() AND p.Status != 2
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
        s.Name as SupplierName
      FROM Payments p
      LEFT JOIN Contracts c ON p.ContractId = c.Id
      LEFT JOIN Suppliers s ON p.SupplierId = s.Id
      WHERE p.Importance = 2 AND p.Status != 2
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
