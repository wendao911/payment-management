# Payment Management macOS 应用构建脚本 (PowerShell版本)
# 使用方法: .\build-mac.ps1 [选项]
# 选项:
#   -Dev     开发模式构建
#   -Clean   清理构建文件
#   -Help    显示帮助信息

param(
    [switch]$Dev,
    [switch]$Clean,
    [switch]$Help
)

# 错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# 项目信息
$ProjectName = "Payment Management"
$PackageName = "payment-management-frontend"

# 函数：打印带颜色的消息
function Write-ColorMessage {
    param(
        [string]$Color,
        [string]$Message
    )
    Write-Host $Message -ForegroundColor $Color
}

# 函数：显示帮助信息
function Show-Help {
    Write-Host "Usage: .\build-mac.ps1 [选项]" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "选项:" -ForegroundColor $Blue
    Write-Host "  -Dev     开发模式构建" -ForegroundColor $Blue
    Write-Host "  -Clean   清理构建文件" -ForegroundColor $Blue
    Write-Host "  -Help    显示帮助信息" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "示例:" -ForegroundColor $Blue
    Write-Host "  .\build-mac.ps1              # 生产模式构建" -ForegroundColor $Blue
    Write-Host "  .\build-mac.ps1 -Dev         # 开发模式构建" -ForegroundColor $Blue
    Write-Host "  .\build-mac.ps1 -Clean       # 清理构建文件" -ForegroundColor $Blue
}

# 函数：检查依赖
function Test-Dependencies {
    Write-ColorMessage $Blue "检查依赖..."
    
    # 检查Node.js
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            Write-ColorMessage $Red "错误: 未找到Node.js，请先安装Node.js"
            exit 1
        }
        Write-Host "Node.js版本: $nodeVersion" -ForegroundColor $Green
    }
    catch {
        Write-ColorMessage $Red "错误: 未找到Node.js，请先安装Node.js"
        exit 1
    }
    
    # 检查npm
    try {
        $npmVersion = npm --version 2>$null
        if (-not $npmVersion) {
            Write-ColorMessage $Red "错误: 未找到npm，请先安装npm"
            exit 1
        }
        Write-Host "npm版本: $npmVersion" -ForegroundColor $Green
    }
    catch {
        Write-ColorMessage $Red "错误: 未找到npm，请先安装npm"
        exit 1
    }
    
    # 检查Electron
    try {
        $electronVersion = npm list electron 2>$null
        if (-not $electronVersion -or $electronVersion -match "empty") {
            Write-ColorMessage $Yellow "警告: 未找到Electron，正在安装..."
            npm install
        }
    }
    catch {
        Write-ColorMessage $Yellow "警告: 未找到Electron，正在安装..."
        npm install
    }
    
    Write-ColorMessage $Green "依赖检查完成"
}

# 函数：清理构建文件
function Clear-BuildFiles {
    Write-ColorMessage $Blue "清理构建文件..."
    
    # 删除构建目录
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build"
        Write-ColorMessage $Green "已删除build目录"
    }
    
    # 删除分发目录
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-ColorMessage $Green "已删除dist目录"
    }
    
    # 删除node_modules (可选)
    $response = Read-Host "是否删除node_modules目录? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force "node_modules"
            Write-ColorMessage $Green "已删除node_modules目录"
        }
    }
    
    Write-ColorMessage $Green "清理完成"
}

# 函数：安装依赖
function Install-Dependencies {
    Write-ColorMessage $Blue "安装依赖..."
    
    if (-not (Test-Path "node_modules")) {
        npm install
        Write-ColorMessage $Green "依赖安装完成"
    }
    else {
        Write-ColorMessage $Yellow "依赖已存在，跳过安装"
    }
}

# 函数：开发模式构建
function Build-Dev {
    Write-ColorMessage $Blue "开发模式构建..."
    
    # 启动开发服务器和Electron
    npm run electron-dev
}

# 函数：生产模式构建
function Build-Production {
    Write-ColorMessage $Blue "生产模式构建..."
    
    # 检查图标文件
    if (-not (Test-Path "public/icon.icns")) {
        Write-ColorMessage $Yellow "警告: 未找到public/icon.icns文件"
        Write-ColorMessage $Yellow "请参考public/ICON_README.md生成图标文件"
        $response = Read-Host "是否继续构建? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    }
    
    # 构建React应用
    Write-ColorMessage $Blue "构建React应用..."
    npm run build
    
    # 构建Electron应用
    Write-ColorMessage $Blue "构建Electron应用..."
    npm run electron-pack-mac
    
    Write-ColorMessage $Green "构建完成！"
    Write-ColorMessage $Green "应用文件位于: dist/"
    
    # 显示构建结果
    if (Test-Path "dist") {
        Write-ColorMessage $Blue "构建结果:"
        Get-ChildItem "dist" | Format-Table Name, Length, LastWriteTime
    }
}

# 函数：验证构建结果
function Test-BuildResult {
    Write-ColorMessage $Blue "验证构建结果..."
    
    if (Test-Path "dist") {
        $appCount = (Get-ChildItem "dist" -Filter "*.app" -Recurse).Count
        $dmgCount = (Get-ChildItem "dist" -Filter "*.dmg" -Recurse).Count
        $zipCount = (Get-ChildItem "dist" -Filter "*.zip" -Recurse).Count
        
        Write-ColorMessage $Green "构建完成:"
        Write-Host "  - 应用包: $appCount个" -ForegroundColor $Green
        Write-Host "  - DMG文件: $dmgCount个" -ForegroundColor $Green
        Write-Host "  - ZIP文件: $zipCount个" -ForegroundColor $Green
        
        if ($appCount -gt 0) {
            Write-ColorMessage $Blue "应用包位置:"
            Get-ChildItem "dist" -Filter "*.app" -Recurse | ForEach-Object {
                Write-Host "  $($_.FullName)" -ForegroundColor $Blue
            }
        }
    }
    else {
        Write-ColorMessage $Red "错误: 构建失败，未找到dist目录"
        exit 1
    }
}

# 主函数
function Main {
    Write-ColorMessage $Blue "=== $ProjectName macOS 应用构建脚本 ==="
    Write-Host ""
    
    # 解析命令行参数
    if ($Help) {
        Show-Help
        return
    }
    
    if ($Clean) {
        Clear-BuildFiles
        return
    }
    
    if ($Dev) {
        Test-Dependencies
        Install-Dependencies
        Build-Dev
        return
    }
    
    # 默认生产模式构建
    Test-Dependencies
    Install-Dependencies
    Build-Production
    Test-BuildResult
}

# 执行主函数
try {
    Main
}
catch {
    Write-ColorMessage $Red "构建过程中发生错误: $($_.Exception.Message)"
    exit 1
}
