@echo off
echo 部署 Supabase Edge Function...
echo.

REM 检查是否已登录 Supabase
supabase projects list >nul 2>&1
if %errorlevel% neq 0 (
    echo 请先登录 Supabase:
    echo supabase login
    pause
    exit /b 1
)

REM 部署 Edge Function
echo 部署 notion-proxy function...
supabase functions deploy notion-proxy

if %errorlevel% equ 0 (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 请在工作空间设置中配置您的 Function URL:
    echo https://YOUR_PROJECT_ID.supabase.co/functions/v1/notion-proxy
    echo.
    echo 替换 YOUR_PROJECT_ID 为您的实际项目ID
) else (
    echo ❌ 部署失败，请检查错误信息
)

pause