@echo off
chcp 65001 >nul
echo 正在停止支付管理系统...

REM 停止服务
docker-compose down

echo 服务已停止
echo 重新启动: start.bat
echo.
pause
