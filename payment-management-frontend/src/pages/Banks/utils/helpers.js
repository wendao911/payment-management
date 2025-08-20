// 获取银行类型文本
export const getBankTypeText = (type) => {
  const typeMap = {
    'Commercial': '商业银行',
    'Investment': '投资银行',
    'Central': '中央银行',
    'Other': '其他'
  };
  return typeMap[type] || type;
};

// 获取银行类型颜色
export const getBankTypeColor = (type) => {
  const colorMap = {
    'Commercial': 'blue',
    'Investment': 'green',
    'Central': 'red',
    'Other': 'default'
  };
  return colorMap[type] || 'default';
};
