@echo off
chcp 65001 >nul
echo Creating minimal deployment package...
echo =====================================

REM 创建部署目录
if exist "payment-management-minimal" rmdir /s /q "payment-management-minimal"
mkdir "payment-management-minimal"

echo Copying core files...

REM 复制核心配置文件
copy "docker-compose.yml" "payment-management-minimal\" >nul
copy "start.sh" "payment-management-minimal\" >nul
copy "stop.sh" "payment-management-minimal\" >nul
copy "start.bat" "payment-management-minimal\" >nul
copy "stop.bat" "payment-management-minimal\" >nul

echo Creating backend structure...

REM 创建后端目录并复制必需文件
mkdir "payment-management-minimal\payment-management-api"
copy "payment-management-api\Dockerfile" "payment-management-minimal\payment-management-api\" >nul
copy "payment-management-api\.dockerignore" "payment-management-minimal\payment-management-api\" >nul
copy "payment-management-api\package.json" "payment-management-minimal\payment-management-api\" >nul
copy "payment-management-api\package-lock.json" "payment-management-minimal\payment-management-api\" >nul
copy "payment-management-api\server.js" "payment-management-minimal\payment-management-api\" >nul
copy "payment-management-api\paymentmanagement.sql" "payment-management-minimal\payment-management-api\" >nul

REM 复制后端源代码目录
xcopy "payment-management-api\config" "payment-management-minimal\payment-management-api\config\" /E /I /Q >nul
xcopy "payment-management-api\middleware" "payment-management-minimal\payment-management-api\middleware\" /E /I /Q >nul
xcopy "payment-management-api\routes" "payment-management-minimal\payment-management-api\routes\" /E /I /Q >nul

echo Creating frontend structure...

REM 创建前端目录并复制必需文件
mkdir "payment-management-minimal\payment-management-frontend"
copy "payment-management-frontend\Dockerfile" "payment-management-minimal\payment-management-frontend\" >nul
copy "payment-management-frontend\.dockerignore" "payment-management-minimal\payment-management-frontend\" >nul
copy "payment-management-frontend\nginx.conf" "payment-management-minimal\payment-management-frontend\" >nul

REM 复制前端构建文件
xcopy "payment-management-frontend\build" "payment-management-minimal\payment-management-frontend\build\" /E /I /Q >nul

REM 创建必要的空目录
mkdir "payment-management-minimal\payment-management-api\uploads" >nul
mkdir "payment-management-minimal\payment-management-api\logs" >nul

REM 复制文档
copy "README.md" "payment-management-minimal\" >nul

echo.
echo ✅ Minimal deployment package created successfully!
echo.
echo 📁 Package location: payment-management-minimal\
echo.
echo 📊 Package size analysis:
for /f "tokens=3" %%a in ('dir "payment-management-minimal" /s /-c ^| find "File(s)"') do echo    Total size: %%a bytes
for /f "tokens=3" %%a in ('dir "payment-management-minimal" /s /-c ^| find "File(s)"') do set /a sizeMB=%%a/1024/1024
echo    Approximate size: %sizeMB% MB
echo.
echo 📋 Package contents:
echo    ✅ Main management script (start.sh)
echo    ✅ Simple stop script (stop.sh)
echo    ✅ Windows batch scripts (start.bat, stop.bat)
echo    ✅ Docker configuration files
echo    ✅ Documentation (README.md)
echo    ✅ Backend API source code
echo    ✅ Frontend built files (no source code)
echo    ✅ Database initialization script
echo.
echo 🚀 Ready to compress and send!
echo    Recommended: Create ZIP file of 'payment-management-minimal' folder
echo.
pause
