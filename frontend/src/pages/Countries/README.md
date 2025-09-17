# Countries 国家管理组件

## 目录结构

```
Countries/
├── index.js                 # 主入口文件
├── Countries.js             # 主要组件文件
├── components/              # 组件目录
│   ├── SearchForm.js        # 搜索表单组件
│   ├── CountriesTable.js    # 国家表格组件
│   └── CountryModal.js      # 国家编辑模态框组件
├── hooks/                   # 自定义 Hooks 目录
│   └── useCountries.js      # 国家数据管理 Hook
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
- **CountriesTable**: 国家列表表格组件，包含分页和操作按钮
- **CountryModal**: 国家新增/编辑模态框组件
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
import Countries from './pages/Countries';

// 在路由中使用
<Route path="/countries" element={<Countries />} />
```

## 主要功能

- 国家列表展示
- 国家信息搜索
- 新增国家
- 编辑国家信息
- 删除国家
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
- 国家名称
- 国家代码
- 状态（启用/禁用）

## 表单验证

- 国家名称：必填
- 国家代码：必填
- 状态：必选
- 货币代码：可选
