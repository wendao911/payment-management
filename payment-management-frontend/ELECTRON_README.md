# Payment Management - Electron macOS 应用构建指南

本项目已配置为使用Electron构建macOS桌面应用。本指南将帮助你完成从开发到打包的完整流程。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd payment-management-frontend
npm install
```

### 2. 开发模式运行

```bash
# 启动开发服务器和Electron
npm run electron-dev

# 或者分别启动
npm start          # 启动React开发服务器
npm run electron   # 启动Electron应用
```

### 3. 构建生产版本

```bash
# 构建macOS应用
npm run electron-pack-mac

# 或者使用构建脚本
./build-mac.sh              # Linux/macOS
.\build-mac.ps1             # Windows PowerShell
```

## 📁 项目结构

```
payment-management-frontend/
├── public/
│   ├── electron.js         # Electron主进程文件
│   ├── preload.js          # 预加载脚本
│   ├── icon.icns           # 应用图标 (需要生成)
│   └── ICON_README.md      # 图标生成说明
├── build-mac.sh            # macOS构建脚本 (Linux/macOS)
├── build-mac.ps1           # macOS构建脚本 (Windows)
├── package.json            # 项目配置和脚本
└── ELECTRON_README.md      # 本文件
```

## 🛠️ 开发指南

### 开发模式

开发模式下，Electron会连接到React开发服务器（localhost:3000），这样你可以：

- 实时查看代码更改
- 使用React开发者工具
- 热重载功能
- 调试Electron主进程

### 主进程 vs 渲染进程

- **主进程** (`public/electron.js`): 管理应用生命周期、窗口、菜单等
- **渲染进程**: React应用运行在渲染进程中
- **预加载脚本** (`public/preload.js`): 安全地暴露API给渲染进程

### 安全最佳实践

- 启用了`contextIsolation`和`nodeIntegration: false`
- 使用预加载脚本暴露安全的API
- 验证所有IPC通道
- 防止导航到外部URL

## 🎨 应用图标

### 必需文件

- `public/icon.icns` - macOS应用图标
- `public/dmg-background.png` - DMG安装包背景（可选）

### 生成图标

参考 `public/ICON_README.md` 文件，其中包含详细的图标生成说明。

## 📦 构建配置

### package.json 配置

```json
{
  "build": {
    "appId": "com.paymentmanagement.app",
    "productName": "Payment Management",
    "mac": {
      "category": "public.app-category.business",
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] }
      ]
    }
  }
}
```

### 支持的架构

- **x64**: Intel Mac
- **arm64**: Apple Silicon (M1/M2) Mac

### 输出格式

- **DMG**: 标准macOS安装包
- **ZIP**: 压缩的应用包
- **APP**: 可直接运行的应用

## 🔧 构建脚本

### 使用方法

#### Linux/macOS
```bash
# 生产构建
./build-mac.sh

# 开发模式
./build-mac.sh --dev

# 清理构建文件
./build-mac.sh --clean

# 显示帮助
./build-mac.sh --help
```

#### Windows PowerShell
```powershell
# 生产构建
.\build-mac.ps1

# 开发模式
.\build-mac.ps1 -Dev

# 清理构建文件
.\build-mac.ps1 -Clean

# 显示帮助
.\build-mac.ps1 -Help
```

### 脚本功能

- 自动检查依赖
- 安装必要的包
- 构建React应用
- 打包Electron应用
- 验证构建结果
- 清理构建文件

## 🚀 部署

### 构建完成后

构建完成后，你会在 `dist/` 目录下找到：

- `Payment Management.app` - 应用包
- `Payment Management.dmg` - 安装包
- `Payment Management.zip` - 压缩包

### 分发方式

1. **直接分发**: 将 `.app` 文件拖拽到 Applications 文件夹
2. **DMG安装**: 双击 `.dmg` 文件进行安装
3. **ZIP分发**: 解压 `.zip` 文件后使用

## 🔍 故障排除

### 常见问题

#### 1. 图标文件缺失
```
错误: 未找到public/icon.icns文件
```
**解决方案**: 参考 `public/ICON_README.md` 生成图标文件

#### 2. 依赖安装失败
```
错误: npm install 失败
```
**解决方案**: 
- 检查Node.js版本（建议16+）
- 清理npm缓存: `npm cache clean --force`
- 删除 `node_modules` 和 `package-lock.json` 后重新安装

#### 3. 构建失败
```
错误: electron-builder 失败
```
**解决方案**:
- 确保在macOS环境下构建
- 检查磁盘空间
- 查看详细错误日志

#### 4. 应用无法启动
```
错误: 应用启动后立即退出
```
**解决方案**:
- 检查控制台日志
- 验证所有依赖是否正确安装
- 确保图标文件格式正确

### 调试技巧

1. **启用详细日志**:
   ```bash
   DEBUG=electron-builder npm run electron-pack-mac
   ```

2. **查看应用日志**:
   ```bash
   # 在终端中运行应用
   ./dist/mac/Payment\ Management.app/Contents/MacOS/Payment\ Management
   ```

3. **检查应用包内容**:
   ```bash
   # 右键应用包 -> 显示包内容
   # 或使用命令行
   ls -la "dist/mac/Payment Management.app/Contents/"
   ```

## 📚 进阶配置

### 自动更新

可以集成 `electron-updater` 实现自动更新功能：

```bash
npm install electron-updater
```

### 代码签名

为了在macOS上分发，建议进行代码签名：

1. 获取Apple Developer证书
2. 在 `package.json` 中配置签名信息
3. 使用 `electron-builder` 进行签名

### 应用公证

macOS Catalina+ 需要应用公证：

```bash
# 使用 electron-builder 自动公证
npm run electron-pack-mac -- --publish=always
```

## 🤝 贡献

如果你遇到问题或有改进建议：

1. 检查现有问题和讨论
2. 创建新的issue
3. 提交pull request

## 📄 许可证

本项目遵循项目主许可证。

---

**注意**: 本指南假设你在macOS环境下进行构建。如果在其他平台上构建macOS应用，可能需要额外的配置和工具。
