# Dashboard 系统概览组件

## 目录结构

```
Dashboard/
├── index.js                     # 主入口文件
├── Dashboard.js                 # 主要组件文件
├── components/                  # 组件目录
│   ├── BankAccountsSummary.js   # 银行账户汇总组件
│   ├── PayablesSummary.js       # 应付汇总组件
│   ├── PaymentRecordsSummary.js # 付款记录汇总组件
│   └── RecentPaymentsTable.js   # 最近付款记录表格组件
├── hooks/                       # 自定义 Hooks 目录
│   └── useDashboard.js          # Dashboard 数据管理 Hook
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
- 保持原有的加载状态和空状态显示
- 美观的卡片设计和渐变背景
- 响应式布局设计
- 统一的表格样式

### 3. 组件化设计
- **BankAccountsSummary**: 银行账户汇总组件，显示账户余额和可用性
- **PayablesSummary**: 应付汇总组件，显示紧急和逾期应付
- **PaymentRecordsSummary**: 付款记录汇总组件，支持按时间粒度筛选
- **RecentPaymentsTable**: 最近付款记录表格组件
- **useDashboard**: Dashboard 数据管理的自定义 Hook

### 4. 样式优化
- 统一的卡片样式
- 渐变背景的卡片头部
- 美观的表格样式
- 响应式设计
- 一致的颜色主题

### 5. 数据管理
- 集中化的数据获取逻辑
- 状态管理优化
- 错误处理机制

## 使用方法

```jsx
import Dashboard from './pages/Dashboard';

// 在路由中使用
<Route path="/dashboard" element={<Dashboard />} />
```

## 主要功能

- 付款预警统计
- 银行账户汇总（统一美元）
- 紧急/逾期应付汇总
- 付款记录汇总（按日/月/年筛选）
- 最近付款记录展示

## 技术特点

- 使用 React Hooks 管理状态
- 自定义 Hooks 封装业务逻辑
- Ant Design 组件库
- 模块化 CSS 样式
- 响应式设计
- 性能优化

## 数据展示

### 银行账户汇总
- 显示所有银行账户的美元余额
- 可用和不可用余额的可视化进度条
- 总余额统计

### 应付汇总
- 紧急应付列表
- 逾期应付列表
- 包含应付金额、已付金额、剩余金额等信息

### 付款记录汇总
- 支持按日、月、年筛选
- 时间范围选择器
- 按应付汇总和时间序列展示

### 最近付款记录
- 显示最近5条付款记录
- 包含完整的付款信息
- 支持附件数量显示

## 样式特性

- 渐变背景的卡片头部
- 阴影效果的卡片
- 悬停高亮的表格行
- 响应式布局
- 统一的颜色主题

## 状态管理

- 各个模块的加载状态
- 数据获取和更新
- 筛选条件管理
- 错误状态处理

## 性能优化

- 使用 useCallback 优化函数引用
- 合理的依赖数组设置
- 组件拆分减少重渲染
- 样式文件集中管理
