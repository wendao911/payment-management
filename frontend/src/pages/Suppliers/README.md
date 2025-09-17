# Suppliers 供应商管理组件

## 目录结构

```
Suppliers/
├── index.js                 # 主入口文件
├── Suppliers.js             # 主要组件文件
├── components/              # 组件目录
│   ├── SearchForm.js        # 搜索表单组件
│   ├── SuppliersTable.js    # 供应商表格组件
│   └── SupplierModal.js     # 供应商编辑模态框组件
├── hooks/                   # 自定义 Hooks 目录
│   └── useSuppliers.js      # 供应商数据管理 Hook
├── styles/                  # 样式文件目录
│   └── index.js             # CSS 样式定义
└── README.md                # 说明文档
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
- **SuppliersTable**: 供应商列表表格组件，包含分页和操作按钮
- **SupplierModal**: 供应商新增/编辑模态框组件
- **useSuppliers**: 供应商数据管理的自定义 Hook

### 4. 样式优化
- 统一的表格样式
- 响应式布局设计
- 美观的查询表单样式
- 一致的颜色主题

### 5. 错误处理
- 完善的错误提示机制
- 网络请求失败时的用户友好提示
- 表单验证错误处理

## 使用方法

```jsx
import Suppliers from './pages/Suppliers';

// 在路由中使用
<Route path="/suppliers" element={<Suppliers />} />
```

## 主要功能

- 供应商列表展示
- 供应商信息搜索
- 新增供应商
- 编辑供应商信息
- 删除供应商
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
- 供应商名称
- 联系人
- 联系电话
- 邮箱地址
- 状态（启用/禁用）

## 表单验证

- 供应商名称：必填
- 联系人：可选
- 电话：可选
- 邮箱：可选
- 地址：可选
- 税号：可选
- 银行账户：可选
- 开户行：可选
- 状态：必选

## 数据字段

- **Name**: 供应商名称
- **ContactPerson**: 联系人
- **Phone**: 联系电话
- **Email**: 邮箱地址
- **Address**: 地址
- **TaxNumber**: 税号
- **BankAccount**: 银行账户
- **BankName**: 开户行
- **IsActive**: 状态（启用/禁用）
