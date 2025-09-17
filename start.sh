#!/bin/bash

# 支付管理系统 - 统一管理脚本
# 安全可靠，功能完整，使用简单

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[信息]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "支付管理系统 - 统一管理脚本"
    echo "=============================="
    echo ""
    echo "使用方法:"
    echo "  ./payment-management.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start      - 启动服务（推荐首次使用）"
    echo "  stop       - 停止服务"
    echo "  restart    - 重启服务"
    echo "  status     - 查看服务状态"
    echo "  logs       - 查看日志"
    echo "  fix        - 修复问题（安全模式，保留数据）"
    echo "  reset      - 完全重置（会删除所有数据）"
    echo "  backup     - 备份数据"
    echo "  restore    - 恢复数据"
    echo "  check      - 检查系统状态"
    echo "  docker     - 诊断 Docker 问题"
    echo "  help       - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh start    # 启动服务"
    echo "  ./start.sh status   # 查看状态"
    echo "  ./start.sh docker   # 诊断 Docker 问题"
    echo "  ./start.sh fix      # 修复问题"
    echo ""
    echo "访问地址:"
    echo "  前端: http://localhost:9000"
    echo "  后端: http://localhost:9001"
    echo "  数据库: localhost:3307"
    echo ""
    echo "默认登录:"
    echo "  用户名: admin"
    echo "  密码: password"
}

# 检查系统环境
check_environment() {
    print_info "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "检测到 macOS 系统"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "检测到 Linux 系统"
    else
        print_warning "未知操作系统: $OSTYPE"
    fi
    
    # 检查 Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker 未安装，请先安装 Docker Desktop"
        print_info "下载地址: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker 未运行"
        print_warning "常见解决方案："
        print_info "1. 启动 Docker Desktop 应用程序"
        print_info "2. 等待 Docker 完全启动（状态栏显示绿色）"
        print_info "3. 如果 Docker Desktop 已启动但仍报错，尝试重启 Docker Desktop"
        print_info "4. 检查 Docker Desktop 设置中的资源分配"
        
        # 检查 Docker Desktop 是否在运行但未就绪
        if pgrep -f "Docker Desktop" > /dev/null 2>&1; then
            print_warning "Docker Desktop 进程已运行，但可能未完全启动"
            print_info "请等待 1-2 分钟让 Docker 完全启动"
        else
            print_warning "Docker Desktop 进程未运行"
            print_info "请手动启动 Docker Desktop 应用程序"
        fi
        
        exit 1
    fi
    
    print_success "Docker 环境正常"
    
    # 检查 Docker Compose
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
        print_success "使用 Docker Compose V2"
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
        print_success "使用 Docker Compose V1"
    else
        print_error "Docker Compose 未安装"
        exit 1
    fi
}

# 修复脚本换行符问题（仅 macOS）
fix_script_encoding() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "修复脚本换行符问题..."
        # 修复当前脚本的换行符
        if [ -f "$0" ]; then
            tr -d '\r' < "$0" > "$0.tmp" && mv "$0.tmp" "$0"
            chmod +x "$0"
        fi
        print_success "脚本换行符已修复"
    fi
}

# 检查端口占用
check_ports() {
    print_info "检查端口占用..."
    
    local ports=(9000 9001 3307)
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            print_warning "端口 $port 被占用"
            conflicts+=($port)
        else
            print_success "端口 $port 空闲"
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        print_warning "发现端口冲突，正在尝试解决..."
        for port in "${conflicts[@]}"; do
            local pid=$(lsof -ti :$port 2>/dev/null)
            if [ -n "$pid" ]; then
                print_info "停止占用端口 $port 的进程 $pid"
                kill -9 $pid 2>/dev/null || true
                sleep 2
                if ! lsof -i :$port >/dev/null 2>&1; then
                    print_success "端口 $port 已释放"
                else
                    print_error "无法释放端口 $port"
                fi
            fi
        done
    fi
}

# 启动服务
start_services() {
    print_info "启动支付管理系统..."
    
    # 检查环境
    check_environment
    fix_script_encoding
    check_ports
    
    # 停止旧容器
    print_info "停止旧容器..."
    $COMPOSE_CMD down >/dev/null 2>&1 || true
    
    # 启动服务
    print_info "启动服务..."
    $COMPOSE_CMD up -d
    
    # 等待服务启动
    print_info "等待服务启动（60秒）..."
    sleep 60
    
    # 检查服务状态
    check_status
    
    # 测试访问
    test_access
    
    print_success "服务启动完成！"
    print_info "访问地址: http://localhost:9000"
    print_info "默认登录: admin / password"
}

# 停止服务
stop_services() {
    print_info "停止支付管理系统..."
    $COMPOSE_CMD down
    print_success "服务已停止"
}

# 重启服务
restart_services() {
    print_info "重启支付管理系统..."
    stop_services
    sleep 5
    start_services
}

# 查看服务状态
check_status() {
    print_info "服务状态:"
    $COMPOSE_CMD ps
    
    print_info "端口监听状态:"
    echo "端口 9000: $(lsof -i :9000 >/dev/null 2>&1 && echo "监听中" || echo "未监听")"
    echo "端口 9001: $(lsof -i :9001 >/dev/null 2>&1 && echo "监听中" || echo "未监听")"
    echo "端口 3307: $(lsof -i :3307 >/dev/null 2>&1 && echo "监听中" || echo "未监听")"
}

# 查看日志
show_logs() {
    print_info "显示服务日志:"
    $COMPOSE_CMD logs --tail=50 -f
}

# 测试访问
test_access() {
    print_info "测试服务访问..."
    
    # 测试前端
    local frontend_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null)
    if [ "$frontend_code" = "200" ] || [ "$frontend_code" = "304" ]; then
        print_success "前端可访问 (HTTP $frontend_code)"
    else
        print_warning "前端无法访问 (HTTP $frontend_code)"
    fi
    
    # 测试后端
    local backend_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9001/api/health 2>/dev/null)
    if [ "$backend_code" = "200" ] || [ "$backend_code" = "404" ]; then
        print_success "后端可访问 (HTTP $backend_code)"
    else
        print_warning "后端无法访问 (HTTP $backend_code)"
    fi
}

# 修复问题（安全模式）
fix_issues() {
    print_info "修复系统问题（安全模式，保留数据）..."
    
    # 检查环境
    check_environment
    
    # 备份数据
    backup_data
    
    # 停止服务
    print_info "停止服务..."
    $COMPOSE_CMD down >/dev/null 2>&1 || true
    
    # 清理未使用的资源（保留数据卷）
    print_info "清理未使用的资源..."
    docker container prune -f >/dev/null 2>&1 || true
    docker image prune -f >/dev/null 2>&1 || true
    docker network prune -f >/dev/null 2>&1 || true
    
    # 重新构建
    print_info "重新构建服务..."
    $COMPOSE_CMD build --no-cache
    
    # 启动服务
    print_info "启动服务..."
    $COMPOSE_CMD up -d
    
    # 等待启动
    print_info "等待服务启动（90秒）..."
    sleep 90
    
    # 检查数据库
    check_database
    
    # 测试访问
    test_access
    
    print_success "问题修复完成！"
}

# 完全重置
reset_system() {
    print_warning "这将删除所有数据，包括数据库！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "操作已取消"
        exit 0
    fi
    
    print_info "完全重置系统..."
    
    # 停止服务
    $COMPOSE_CMD down >/dev/null 2>&1 || true
    
    # 删除所有相关资源
    print_info "删除所有资源..."
    $COMPOSE_CMD down --volumes --rmi all >/dev/null 2>&1 || true
    docker system prune -a -f >/dev/null 2>&1 || true
    
    # 重新启动
    start_services
    
    print_success "系统重置完成！"
}

# 备份数据
backup_data() {
    print_info "备份数据..."
    
    local backup_dir="backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/payment_management_backup_$timestamp.sql"
    
    # 创建备份目录
    mkdir -p "$backup_dir"
    
    # 备份数据库
    if docker ps | grep -q payment_management_mysql; then
        print_info "备份数据库..."
        docker exec payment_management_mysql mysqldump -u root -ppayment123 paymentmanagement > "$backup_file" 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "数据库备份完成: $backup_file"
        else
            print_warning "数据库备份失败"
        fi
    else
        print_warning "数据库容器未运行，跳过备份"
    fi
}

# 恢复数据
restore_data() {
    print_info "恢复数据..."
    
    local backup_dir="backups"
    local backup_files=($(ls -t "$backup_dir"/payment_management_backup_*.sql 2>/dev/null))
    
    if [ ${#backup_files[@]} -eq 0 ]; then
        print_error "未找到备份文件"
        return 1
    fi
    
    print_info "可用的备份文件:"
    for i in "${!backup_files[@]}"; do
        echo "  $((i+1)). ${backup_files[$i]}"
    done
    
    read -p "请选择要恢复的备份文件 (1-${#backup_files[@]}): " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#backup_files[@]} ]; then
        local selected_file="${backup_files[$((choice-1))]}"
        print_info "恢复备份文件: $selected_file"
        
        if docker ps | grep -q payment_management_mysql; then
            docker exec -i payment_management_mysql mysql -u root -ppayment123 paymentmanagement < "$selected_file"
            if [ $? -eq 0 ]; then
                print_success "数据恢复完成"
            else
                print_error "数据恢复失败"
            fi
        else
            print_error "数据库容器未运行"
        fi
    else
        print_error "无效的选择"
    fi
}

# 检查数据库
check_database() {
    print_info "检查数据库..."
    
    # 等待数据库启动
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec payment_management_mysql mysqladmin ping -h localhost -u root -ppayment123 >/dev/null 2>&1; then
            print_success "数据库连接正常"
            break
        else
            print_info "等待数据库启动... ($((attempt+1))/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "数据库启动超时"
        return 1
    fi
    
    # 检查用户表
    local user_count=$(docker exec payment_management_mysql mysql -u root -ppayment123 paymentmanagement -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1 2>/dev/null)
    
    if [ -n "$user_count" ] && [ "$user_count" -gt 0 ]; then
        print_success "用户表有 $user_count 个用户"
    else
        print_warning "用户表为空，创建默认用户..."
        docker exec payment_management_mysql mysql -u root -ppayment123 paymentmanagement -e "
        INSERT INTO users (Username, Email, Password, Role, CreatedAt, UpdatedAt) 
        VALUES ('admin', 'admin@example.com', '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW(), NOW())
        ON DUPLICATE KEY UPDATE Username=Username;" 2>/dev/null
        print_success "默认用户已创建 (admin/password)"
    fi
}

# 诊断 Docker 问题
diagnose_docker() {
    print_info "诊断 Docker 问题..."
    
    # 检查 Docker 命令是否存在
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker 命令不存在"
        print_info "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
        return 1
    fi
    
    # 检查 Docker 进程
    print_info "检查 Docker 进程..."
    if pgrep -f "Docker Desktop" > /dev/null 2>&1; then
        print_success "Docker Desktop 进程正在运行"
    else
        print_warning "Docker Desktop 进程未运行"
        print_info "请启动 Docker Desktop 应用程序"
    fi
    
    # 检查 Docker socket
    print_info "检查 Docker socket..."
    if [ -S "/var/run/docker.sock" ] || [ -S "$HOME/.docker/run/docker.sock" ]; then
        print_success "Docker socket 存在"
    else
        print_warning "Docker socket 不存在"
        print_info "这通常表示 Docker daemon 未启动"
    fi
    
    # 尝试连接 Docker
    print_info "尝试连接 Docker daemon..."
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon 连接成功"
        return 0
    else
        print_error "无法连接到 Docker daemon"
        print_warning "解决方案："
        print_info "1. 确保 Docker Desktop 完全启动"
        print_info "2. 重启 Docker Desktop"
        print_info "3. 检查 Docker Desktop 设置"
        print_info "4. 检查系统资源是否充足"
        return 1
    fi
}

# 检查系统状态
check_system() {
    print_info "检查系统状态..."
    
    # 检查 Docker
    if docker info >/dev/null 2>&1; then
        print_success "Docker 运行正常"
    else
        print_error "Docker 未运行"
        print_info "运行诊断..."
        diagnose_docker
        return 1
    fi
    
    # 检查容器
    check_status
    
    # 检查端口
    check_ports
    
    # 测试访问
    test_access
    
    # 检查数据库
    if docker ps | grep -q payment_management_mysql; then
        check_database
    else
        print_warning "数据库容器未运行"
    fi
}

# 主函数
main() {
    # 检查是否在正确目录
    if [ ! -f "docker-compose.yml" ]; then
        print_error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    # 处理命令
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        fix)
            fix_issues
            ;;
        reset)
            reset_system
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        check)
            check_system
            ;;
        docker)
            diagnose_docker
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
