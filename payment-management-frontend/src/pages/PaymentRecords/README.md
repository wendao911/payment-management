# PaymentRecords 付款记录管理

## 目录结构

```
PaymentRecords/
├── index.js                      # 主入口文件
├── PaymentRecords.js             # 主要组件（页面编排）
├── components/                   # 子组件
│   ├── SearchForm.js             # 查询表单
│   ├── PaymentRecordsTable.js    # 付款记录表格
│   ├── SummaryCards.js           # 顶部统计卡片
│   └── PaymentRecordDetailModal.js # 详情弹窗（含附件）
├── hooks/
│   └── usePaymentRecords.js      # 数据获取与业务逻辑 Hook
├── styles/
│   └── index.js                  # 样式（CSS-in-JS）
└── README.md
```

## 优化点（对齐 BankAccounts 模式）
- 页面职责下沉到自定义 Hook（数据获取、搜索、详情获取）
- UI 分解为独立组件（表单/表格/统计卡/详情弹窗）
- 统一样式与表格交互体验
- 加强错误提示与加载状态管理

## 交互体验
- 查询/重置带 loading 状态
- 详情弹窗支持附件的增删下载（与后端 `/attachment/payment/:id` 对接）
- 金额自动换算 USD 并展示

## 使用
```jsx
import PaymentRecords from '@/pages/PaymentRecords';
<Route path="/payment-records" element={<PaymentRecords />} />
```
