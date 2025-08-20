// 状态相关工具函数
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'default';
    case 'partial': return 'processing';
    case 'completed': return 'success';
    case 'overdue': return 'error';
    default: return 'default';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待付款';
    case 'partial': return '部分付款';
    case 'completed': return '已完成';
    case 'overdue': return '逾期';
    default: return '未知';
  }
};

// 重要程度相关工具函数
export const getImportanceColor = (importance) => {
  switch (importance) {
    case 'normal': return 'default';
    case 'important': return 'processing';
    case 'very_important': return 'error';
    default: return 'default';
  }
};

export const getImportanceText = (importance) => {
  switch (importance) {
    case 'normal': return '一般';
    case 'important': return '重要';
    case 'very_important': return '非常重要';
    default: return '未知';
  }
};

// 紧急程度相关工具函数
export const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'normal': return 'default';
    case 'urgent': return 'processing';
    case 'very_urgent': return 'error';
    case 'overdue': return 'red';
    default: return 'default';
  }
};

export const getUrgencyText = (urgency) => {
  switch (urgency) {
    case 'normal': return '一般';
    case 'urgent': return '紧急';
    case 'very_urgent': return '非常紧急';
    case 'overdue': return '已延期';
    default: return '未知';
  }
};

// 汇率转换工具函数
export const getExchangeRateToUSD = (currencyCode, currencies = []) => {
  if (!currencyCode) return 1;
  const upper = String(currencyCode).toUpperCase();
  if (upper === 'USD') return 1.0;
  if (upper === 'CNY' || upper === 'RMB') return 7.2;
  const cur = currencies.find(c => (c.Code || '').toUpperCase() === upper);
  const rate = cur?.ExchangeRate ?? cur?.exchangeRate;
  return rate && rate > 0 ? rate : 1.0;
};

export const convertToUSD = (amount, currencyCode, currencies = []) => {
  const numeric = Number(amount || 0);
  const rate = getExchangeRateToUSD(currencyCode, currencies);
  if (!rate || rate <= 0) return numeric;
  // rate表示 1 USD = rate [currencyCode]
  // 因此 某币种金额 -> USD = 金额 / rate
  return numeric / rate;
};

// 合同查找工具函数
export const findContractById = (contracts, contractId) => {
  for (const contract of contracts) {
    if (contract.Id === contractId) {
      return contract;
    }
    // 递归查找子合同
    if (contract.children && contract.children.length > 0) {
      const found = findContractById(contract.children, contractId);
      if (found) return found;
    }
  }
  return null;
};

// 数据验证工具函数
export const validatePayableData = (data) => {
  const errors = [];
  
  if (!data.payableNumber || data.payableNumber.trim() === '') {
    errors.push('请输入应付编号');
  }
  if (!data.contractId || isNaN(data.contractId)) {
    errors.push('请选择有效的合同');
  }
  if (!data.supplierId || isNaN(data.supplierId)) {
    errors.push('请选择有效的供应商');
  }
  if (!data.payableAmount || isNaN(data.payableAmount) || data.payableAmount <= 0) {
    errors.push('请输入有效的应付金额');
  }
  if (!data.currencyCode) {
    errors.push('请选择币种');
  }
  if (!data.paymentDueDate) {
    errors.push('请选择付款截止日期');
  }
  
  return errors;
};

export const validatePaymentRecordData = (data) => {
  const errors = [];
  
  if (!data.paymentNumber || data.paymentNumber.trim() === '') {
    errors.push('请输入付款编号');
  }
  if (!data.paymentDescription || data.paymentDescription.trim() === '') {
    errors.push('请输入付款说明');
  }
  if (!data.paymentAmount || isNaN(data.paymentAmount) || data.paymentAmount <= 0) {
    errors.push('请输入有效的付款金额');
  }
  if (!data.currencyCode) {
    errors.push('请选择币种');
  }
  if (!data.paymentDate) {
    errors.push('请选择付款日期');
  }
  
  return errors;
};
