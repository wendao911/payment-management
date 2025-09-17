# Payments 页面重构后的目录结构

## 重构前 vs 重构后

### 重构前
```
Payments/
├── index.js (819行，包含所有逻辑)
├── PayableModal.js
├── PaymentRecordModal.js
├── PayableDetailModal.js
├── PaymentRecordDetailModal.js
├── SearchForm.js
└── styles.js
```

### 重构后
```
Payments/
├── components/           # 新增：组件目录
│   ├── PaymentsTable.js # 新增：主表格组件
│   ├── PayableModal.js  # 新增：应付管理模态框
│   ├── PaymentRecordModal.js # 新增：付款记录模态框
│   ├── PayableDetailModal.js # 新增：应付详情模态框
│   ├── PaymentRecordDetailModal.js # 新增：付款记录详情模态框
│   └── SearchForm.js    # 新增：搜索表单组件
├── hooks/               # 新增：自定义 hooks 目录
│   ├── usePayables.js   # 新增：应付管理相关逻辑
│   ├── usePaymentRecords.js # 新增：付款记录相关逻辑
│   ├── useWarnings.js   # 新增：预警相关逻辑
│   ├── useCurrencies.js # 新增：货币相关逻辑
│   ├── useSuppliers.js  # 新增：供应商相关逻辑
│   └── useContracts.js  # 新增：合同相关逻辑
├── styles/              # 重构：样式目录
│   └── index.js         # 重构：表格样式、列配置和所有样式定义（已合并原 styles.js）
├── utils/               # 新增：工具函数目录
│   └── helpers.js       # 新增：通用工具函数
├── Payments.js          # 重构：主页面组件（从819行减少到约200行）
├── index.js             # 重构：简化为导出语句
├── README.md            # 新增：详细文档
└── STRUCTURE.md         # 新增：本文档
```

## 重构效果

### 1. 代码行数减少
- **重构前**: 主文件 819 行
- **重构后**: 主文件约 200 行，减少了约 75%

### 2. 关注点分离
- **业务逻辑**: 提取到自定义 hooks 中
- **UI 组件**: 分离到 components 目录
- **样式配置**: 集中到 styles 目录
- **工具函数**: 提取到 utils 目录

### 3. 可维护性提升
- 每个文件职责单一，易于理解和修改
- 逻辑复用性更强
- 测试更容易进行
- 团队协作更高效

### 4. 性能优化
- 使用 useCallback 优化函数性能
- 避免不必要的重新渲染
- 更好的内存管理

## 文件职责说明

### hooks/
- **usePayables.js**: 应付账款的核心业务逻辑
- **usePaymentRecords.js**: 付款记录的业务逻辑
- **useWarnings.js**: 预警数据的获取和管理
- **useCurrencies.js**: 货币数据的获取
- **useSuppliers.js**: 供应商数据的获取
- **useContracts.js**: 合同数据的获取和转换

### components/
- **PaymentsTable.js**: 主表格组件，处理数据展示和交互
- **PayableModal.js**: 应付管理模态框，处理新增和编辑应付
- **PaymentRecordModal.js**: 付款记录模态框，处理新增和编辑付款记录
- **PayableDetailModal.js**: 应付详情模态框，显示应付详细信息和付款记录
- **PaymentRecordDetailModal.js**: 付款记录详情模态框，显示付款记录详细信息
- **SearchForm.js**: 搜索表单组件，处理搜索和过滤功能

### styles/
- **index.js**: 表格样式定义和列配置函数

### utils/
- **helpers.js**: 通用工具函数，如数据验证、货币转换等

### 主文件
- **Payments.js**: 页面主组件，负责状态管理和组件协调
- **index.js**: 页面入口，简化为导出语句

## 重构原则

1. **单一职责原则**: 每个文件只负责一个特定的功能
2. **关注点分离**: 将业务逻辑、UI 组件、样式、工具函数分别管理
3. **可复用性**: 通过 hooks 和工具函数提高代码复用性
4. **可测试性**: 逻辑分离后更容易进行单元测试
5. **可维护性**: 代码结构清晰，易于理解和修改

## 参考模式

重构后的结构参考了 BankAccounts 页面的组织方式，保持了项目整体的一致性，同时为其他页面的重构提供了可参考的模式。
