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

// 货币转换相关函数 - 使用更完整的实现
export const convertToUSD = (amount, fromCurrency, currencies = []) => {
  if (!amount || !fromCurrency) return 0;
  
  // 如果已经是USD，直接返回
  if (fromCurrency === 'USD') return parseFloat(amount);
  
  // 查找货币的汇率信息
  const currency = currencies.find(c => c.Code === fromCurrency);
  if (currency && currency.ExchangeRate) {
    return parseFloat(amount) * parseFloat(currency.ExchangeRate);
  }
  
  // 如果没有找到汇率，返回原值
  return parseFloat(amount);
};

// 合同查找函数 - 使用更完整的实现
export const findContractById = (contractId, contracts = []) => {
  if (!contractId) return null;
  
  const findContract = (contracts, id) => {
    for (const contract of contracts) {
      if (contract.Id === id) {
        return contract;
      }
      if (contract.children && contract.children.length > 0) {
        const found = findContract(contract.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findContract(contracts, contractId);
};

// 数据验证函数 - 使用更完整的实现
export const validatePayableData = (values) => {
  const errors = [];
  
  if (!values.PayableNumber) {
    errors.push('应付编号不能为空');
  }
  
  if (!values.SupplierId) {
    errors.push('供应商不能为空');
  }
  
  if (!values.ContractId) {
    errors.push('合同不能为空');
  }
  
  if (!values.PayableAmount || values.PayableAmount <= 0) {
    errors.push('应付金额必须大于0');
  }
  
  if (!values.CurrencyCode) {
    errors.push('币种不能为空');
  }
  
  if (!values.PaymentDueDate) {
    errors.push('付款到期日不能为空');
  }
  
  return errors;
};

export const validatePaymentRecordData = (values) => {
  const errors = [];
  
  // 统一读取表单/提交使用的 PascalCase 字段
  if (!values.PaymentNumber) {
    errors.push('付款编号不能为空');
  }
  
  if (!values.CurrencyCode) {
    errors.push('币种不能为空');
  }
  
  if (!values.PaymentDescription) {
    errors.push('付款描述不能为空');
  }
  
  if (!values.PaymentAmount || values.PaymentAmount <= 0) {
    errors.push('付款金额必须大于0');
  }
  
  if (!values.PaymentDate) {
    errors.push('付款日期不能为空');
  }
  
  return errors;
};
