@echo off
setlocal enabledelayedexpansion

echo 📦 Building frontend...
cd BackOffice
call npm run build
cd ..

echo 🔨 Building backend (Windows binary)...
cd backend

:: Nếu build native trên Windows thì không cần GOOS, GOARCH
:: Nếu bạn cài mingw-w64 thì có thể dùng cross-compile (khá phức tạp trong batch)
set CGO_ENABLED=1
go build -o app.exe

cd ..

echo 📁 Preparing build folder...

:: Xóa thư mục build nếu có
if exist build (
    echo Xoa thu muc build cu...
    rmdir /s /q build
    rmdir /s /q AgentCoin-Server/server
)

:: Tạo thư mục build và build\db
mkdir build
mkdir build\db

mkdir AgentCoin-Server\server
mkdir AgentCoin-Server\server\db

:: Copy backend binary
copy backend\app.exe build\app.exe >nul
copy backend\app.exe AgentCoin-Server\server\app.exe >nul

:: Copy database nếu tồn tại
if exist backend\db\data.db (
    copy backend\db\data.db build\db\data.db >nul
    copy backend\db\data.db AgentCoin-Server\server\db\data.db >nul
    echo ✅ Copied database file: data.db
)

:: Copy env file nếu tồn tại
if exist backend\.env.dev (
    copy backend\.env.dev build\.env.dev >nul
    echo ✅ Copied env file: .env.dev
)

:: Copy frontend build files
xcopy /s /e /y BackOffice\dist\* build\
xcopy /s /e /y BackOffice\dist\* AgentCoin-Server\server\

echo 🚀 Done! Transfer the build\ folder to your Windows machine and run app.exe

endlocal
