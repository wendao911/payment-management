#!/bin/bash

# Payment Management macOS 应用构建脚本
# 使用方法: ./build-mac.sh [选项]
# 选项:
#   --dev     开发模式构建
#   --clean   清理构建文件
#   --help    显示帮助信息

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="Payment Management"
PACKAGE_NAME="payment-management-frontend"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：显示帮助信息
show_help() {
    echo "Usage: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --dev     开发模式构建"
    echo "  --clean   清理构建文件"
    echo "  --help    显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 生产模式构建"
    echo "  $0 --dev        # 开发模式构建"
    echo "  $0 --clean      # 清理构建文件"
}

# 函数：检查依赖
check_dependencies() {
    print_message $BLUE "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_message $RED "错误: 未找到Node.js，请先安装Node.js"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_message $RED "错误: 未找到npm，请先安装npm"
        exit 1
    fi
    
    # 检查Electron
    if ! npm list electron &> /dev/null; then
        print_message $YELLOW "警告: 未找到Electron，正在安装..."
        npm install
    fi
    
    print_message $GREEN "依赖检查完成"
}

# 函数：清理构建文件
clean_build() {
    print_message $BLUE "清理构建文件..."
    
    # 删除构建目录
    if [ -d "build" ]; then
        rm -rf build
        print_message $GREEN "已删除build目录"
    fi
    
    # 删除分发目录
    if [ -d "dist" ]; then
        rm -rf dist
        print_message $GREEN "已删除dist目录"
    fi
    
    # 删除node_modules (可选)
    read -p "是否删除node_modules目录? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -d "node_modules" ]; then
            rm -rf node_modules
            print_message $GREEN "已删除node_modules目录"
        fi
    fi
    
    print_message $GREEN "清理完成"
}

# 函数：安装依赖
install_dependencies() {
    print_message $BLUE "安装依赖..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_message $GREEN "依赖安装完成"
    else
        print_message $YELLOW "依赖已存在，跳过安装"
    fi
}

# 函数：开发模式构建
build_dev() {
    print_message $BLUE "开发模式构建..."
    
    # 启动开发服务器和Electron
    npm run electron-dev
}

# 函数：生产模式构建
build_production() {
    print_message $BLUE "生产模式构建..."
    
    # 检查图标文件
    if [ ! -f "public/icon.icns" ]; then
        print_message $YELLOW "警告: 未找到public/icon.icns文件"
        print_message $YELLOW "请参考public/ICON_README.md生成图标文件"
        read -p "是否继续构建? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 构建React应用
    print_message $BLUE "构建React应用..."
    npm run build
    
    # 构建Electron应用
    print_message $BLUE "构建Electron应用..."
    npm run electron-pack-mac
    
    print_message $GREEN "构建完成！"
    print_message $GREEN "应用文件位于: dist/"
    
    # 显示构建结果
    if [ -d "dist" ]; then
        print_message $BLUE "构建结果:"
        ls -la dist/
    fi
}

# 函数：验证构建结果
verify_build() {
    print_message $BLUE "验证构建结果..."
    
    if [ -d "dist" ]; then
        local app_count=$(find dist -name "*.app" | wc -l)
        local dmg_count=$(find dist -name "*.dmg" | wc -l)
        local zip_count=$(find dist -name "*.zip" | wc -l)
        
        print_message $GREEN "构建完成:"
        print_message $GREEN "  - 应用包: ${app_count}个"
        print_message $GREEN "  - DMG文件: ${dmg_count}个"
        print_message $GREEN "  - ZIP文件: ${zip_count}个"
        
        if [ $app_count -gt 0 ]; then
            print_message $BLUE "应用包位置:"
            find dist -name "*.app" -exec echo "  {}" \;
        fi
    else
        print_message $RED "错误: 构建失败，未找到dist目录"
        exit 1
    fi
}

# 主函数
main() {
    print_message $BLUE "=== ${PROJECT_NAME} macOS 应用构建脚本 ==="
    echo ""
    
    # 解析命令行参数
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --clean)
            clean_build
            exit 0
            ;;
        --dev)
            check_dependencies
            install_dependencies
            build_dev
            ;;
        "")
            check_dependencies
            install_dependencies
            build_production
            verify_build
            ;;
        *)
            print_message $RED "错误: 未知选项 '$1'"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
