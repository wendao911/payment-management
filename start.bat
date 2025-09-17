@echo off
chcp 65001 >nul
echo 正在启动支付管理系统...
echo ==================================

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

echo Docker 环境检查通过

REM 停止可能存在的旧容器
echo 停止旧容器...
docker-compose down >nul 2>&1

REM 启动服务
echo 启动服务...
docker-compose up --build -d

REM 等待服务启动
echo 等待服务启动...
timeout /t 20 /nobreak >nul

REM 检查服务状态
echo 检查服务状态...
docker-compose ps

echo.
echo 启动完成！
echo 前端地址: http://localhost:9000
echo 后端地址: http://localhost:9001
echo 数据库地址: localhost:3307
echo.
echo 查看日志: docker-compose logs
echo 停止服务: stop.bat
echo.
pause
