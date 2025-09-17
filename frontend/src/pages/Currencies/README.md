# 币种管理

## 功能概述

币种管理模块用于管理系统中的各种货币信息，包括币种代码、名称、符号和汇率等。

## 主要功能

### 1. 币种列表
- 显示所有币种信息
- 支持分页显示
- 显示币种代码、名称、符号、汇率、状态等字段

### 2. 搜索功能
- 按币种代码搜索
- 按币种名称搜索
- 按启用状态筛选

### 3. 新增币种
- 币种代码（1-3个字符）
- 币种名称（1-50个字符）
- 币种符号（可选，最多10个字符）
- 对美元汇率（6位小数精度）
- 启用状态

### 4. 编辑币种
- 修改币种信息
- 实时验证数据有效性

### 5. 删除币种
- 软删除（设置IsActive为false）
- 检查币种是否被使用，防止误删

### 6. 批量更新汇率
- 支持批量更新多个币种的汇率
- 事务处理确保数据一致性

## 技术特点

### 前端
- 使用React Hooks管理状态
- Ant Design组件库提供UI
- 响应式设计，支持移动端
- 表单验证和错误处理

### 后端
- RESTful API设计
- 参数验证和错误处理
- 数据库事务支持
- 软删除机制

## 数据库表结构

```sql
CREATE TABLE currencies (
  Id int NOT NULL AUTO_INCREMENT,
  Code varchar(3) NOT NULL COMMENT '币种代码(ISO 4217)',
  Name varchar(50) NOT NULL COMMENT '币种名称',
  Symbol varchar(10) NULL COMMENT '币种符号',
  ExchangeRate decimal(18, 6) NULL DEFAULT 1.000000 COMMENT '对美元汇率',
  IsActive tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  CreatedAt timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (Id),
  UNIQUE INDEX Code (Code)
);
```

## API接口

### 获取币种列表
- `GET /currencies`
- 返回所有启用的币种

### 获取单个币种
- `GET /currencies/:id`
- 返回指定ID的币种详情

### 搜索币种
- `GET /currencies/search?code=&name=&isActive=`
- 支持多条件搜索

### 创建币种
- `POST /currencies`
- 创建新的币种记录

### 更新币种
- `PUT /currencies/:id`
- 更新指定币种信息

### 删除币种
- `DELETE /currencies/:id`
- 软删除币种

### 批量更新汇率
- `POST /currencies/batch-update-rates`
- 批量更新多个币种汇率

## 使用说明

1. **新增币种**：点击"新增币种"按钮，填写币种信息
2. **编辑币种**：点击操作列的编辑按钮，修改币种信息
3. **删除币种**：点击操作列的删除按钮，确认后删除
4. **搜索币种**：使用搜索表单按条件筛选币种
5. **刷新数据**：点击刷新按钮获取最新数据

## 注意事项

1. 币种代码必须唯一，不能重复
2. 汇率必须是非负数
3. 已使用的币种无法删除
4. 币种代码建议使用ISO 4217标准
5. 汇率更新会影响系统中的金额计算

## 扩展功能

- 汇率历史记录
- 自动汇率更新
- 多币种转换计算
- 汇率趋势图表
- 币种使用统计
