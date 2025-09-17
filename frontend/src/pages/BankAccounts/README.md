# BankAccounts 银行账户管理组件

## 目录结构

```
BankAccounts/
├── index.js                     # 主入口文件
├── BankAccounts.js              # 主要组件文件
├── components/                  # 组件目录
│   ├── SearchForm.js            # 搜索表单组件
│   ├── BankAccountsTable.js     # 银行账户表格组件
│   ├── BalanceExpandedRow.js    # 余额展开行组件
│   ├── BankAccountModal.js      # 银行账户编辑模态框组件
│   └── BalanceModal.js          # 余额记录编辑模态框组件
├── hooks/                       # 自定义 Hooks 目录
│   ├── useBankAccounts.js       # 银行账户数据管理 Hook
│   ├── useBanks.js              # 银行数据管理 Hook
│   └── useCurrencies.js         # 货币数据管理 Hook
├── utils/                       # 工具函数目录
│   └── helpers.js               # 辅助函数
├── styles/                      # 样式文件目录
│   └── index.js                 # CSS 样式定义
└── README.md                    # 说明文档
```

## 优化内容

### 1. 代码拆分
- 将原来的单文件组件拆分为多个小组件
- 每个组件职责单一，便于维护和测试
- 使用自定义 Hooks 管理状态和业务逻辑

### 2. 用户体验优化
- 添加保存/更新时的加载状态
- 按钮在提交时显示加载动画
- 成功/失败操作的 Toast 提示
- 删除操作时的确认对话框和进度反馈

### 3. 组件化设计
- **SearchForm**: 搜索表单组件，支持多条件查询
- **BankAccountsTable**: 银行账户列表表格组件，包含分页和操作按钮
- **BalanceExpandedRow**: 余额记录展开行组件，显示账户的余额历史
- **BankAccountModal**: 银行账户新增/编辑模态框组件
- **BalanceModal**: 余额记录新增/编辑模态框组件

### 4. 自定义 Hooks
- **useBankAccounts**: 银行账户数据管理，包含增删改查逻辑
- **useBanks**: 银行数据获取
- **useCurrencies**: 货币数据获取

### 5. 样式优化
- 统一的表格样式
- 响应式布局设计
- 美观的查询表单样式
- 一致的颜色主题

### 6. 错误处理
- 完善的错误提示机制
- 网络请求失败时的用户友好提示
- 表单验证错误处理

## 使用方法

```jsx
import BankAccounts from './pages/BankAccounts';

// 在路由中使用
<Route path="/bank-accounts" element={<BankAccounts />} />
```

## 主要功能

- 银行账户列表展示
- 银行账户信息搜索
- 新增银行账户
- 编辑银行账户信息
- 删除银行账户
- 余额记录管理
- 分页显示
- 响应式设计

## 技术特点

- 使用 React Hooks 管理状态
- 自定义 Hooks 封装业务逻辑
- Ant Design 组件库
- 模块化 CSS 样式
- 错误边界处理
- 性能优化

## 搜索功能

支持按以下条件搜索：
- 银行名称
- 账户名称
- 账户类型
- 货币代码
- 状态（启用/禁用）

## 表单验证

### 银行账户表单
- 银行：必选
- 账户名称：必填
- 账户类型：必选
- 货币：必选
- 初始余额：可选，不能为负数
- 状态：必选

### 余额记录表单
- 余额日期：必填
- 余额金额：必填，不能为负数
- 备注：可选

## 数据字段

### 银行账户
- **BankId**: 银行ID
- **AccountName**: 账户名称
- **AccountType**: 账户类型
- **CurrencyCode**: 货币代码
- **InitialBalance**: 初始余额
- **IsActive**: 状态（启用/禁用）

### 余额记录
- **BalanceDate**: 余额日期
- **BalanceAmount**: 余额金额
- **Notes**: 备注

## 表格特性

- 可展开行显示余额记录
- 分页功能
- 排序功能
- 响应式列宽
- 操作按钮（编辑、删除余额、查看余额）

## 模态框功能

- 银行账户新增/编辑
- 余额记录新增/编辑
- 表单验证
- 加载状态
- 成功/失败反馈

## 状态管理

- 账户数据状态
- 搜索过滤状态
- 模态框显示状态
- 编辑状态
- 加载状态

## 性能优化

- 使用 useCallback 优化函数引用
- 合理的依赖数组设置
- 组件拆分减少重渲染
- 样式文件集中管理

## 错误处理

- API 请求错误处理
- 表单验证错误提示
- 网络连接错误提示
- 用户友好的错误信息

## 响应式设计

- 移动端适配
- 表格列宽自适应
- 搜索表单响应式布局
- 模态框尺寸适配
