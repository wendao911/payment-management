// 币种符号映射 - 从币种表获取
export const getCurrencySymbol = (currencyCode, currencies) => {
  if (!currencies || currencies.length === 0) {
    return currencyCode;
  }
  
  const currency = currencies.find(c => c.Code === currencyCode);
  return currency ? currency.Symbol || currencyCode : currencyCode;
};

// 获取账户类型文本
export const getAccountTypeText = (type) => {
  const typeMap = {
    'Checking': '活期账户',
    'Savings': '储蓄账户',
    'Investment': '投资账户',
    'Other': '其他账户'
  };
  return typeMap[type] || type;
};

// 获取账户类型颜色
export const getAccountTypeColor = (type) => {
  const colorMap = {
    'Checking': 'blue',
    'Savings': 'green',
    'Investment': 'orange',
    'Other': 'default'
  };
  return colorMap[type] || 'default';
};
