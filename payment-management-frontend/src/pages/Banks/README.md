# Banks 银行管理组件

## 目录结构

```
Banks/
├── index.js                 # 主入口文件
├── Banks.js                 # 主要组件文件
├── components/              # 组件目录
│   ├── SearchForm.js        # 搜索表单组件
│   ├── BanksTable.js        # 银行表格组件
│   └── BankModal.js         # 银行编辑模态框组件
├── hooks/                   # 自定义 Hooks 目录
│   ├── useBanks.js          # 银行数据管理 Hook
│   └── useCountries.js      # 国家数据管理 Hook
├── utils/                   # 工具函数目录
│   └── helpers.js           # 辅助函数
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
- **BanksTable**: 银行列表表格组件，包含分页和操作按钮
- **BankModal**: 银行新增/编辑模态框组件
- **useBanks**: 银行数据管理的自定义 Hook
- **useCountries**: 国家数据管理的自定义 Hook

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
import Banks from './pages/Banks';

// 在路由中使用
<Route path="/banks" element={<Banks />} />
```

## 主要功能

- 银行列表展示
- 银行信息搜索
- 新增银行
- 编辑银行信息
- 删除银行
- 分页显示
- 响应式设计

## 技术特点

- 使用 React Hooks 管理状态
- 自定义 Hooks 封装业务逻辑
- Ant Design 组件库
- 模块化 CSS 样式
- 错误边界处理
- 性能优化
