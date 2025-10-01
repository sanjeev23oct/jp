@echo off
REM HTML Prototype Builder - Quick Start Script for Windows
REM This script helps you get started quickly

echo.
echo 🚀 HTML Prototype Builder - Quick Start
echo ========================================
echo.

REM Check Node.js
echo 📋 Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo ✅ npm detected
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Setup backend environment
echo ⚙️  Setting up backend configuration...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo ✅ Created backend\.env from example
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env and add your LLM API key!
    echo    File location: backend\.env
    echo    Required: LLM_API_KEY=your_api_key_here
    echo.
) else (
    echo ✅ backend\.env already exists
)

REM Setup frontend environment
if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env"
    echo ✅ Created frontend\.env from example
) else (
    echo ✅ frontend\.env already exists
)
echo.

REM Build shared package
echo 🔨 Building shared package...
cd shared
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to build shared package
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Shared package built
echo.

REM Final instructions
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit backend\.env and add your LLM API key
echo 2. Run 'npm run dev' to start both servers
echo 3. Open http://localhost:5173 in your browser
echo.
echo 📚 Documentation:
echo - GETTING_STARTED.md - Step-by-step tutorial
echo - SETUP.md - Detailed setup guide
echo - README.md - Project overview
echo.
echo 🎉 Happy prototyping!
echo.
pause

