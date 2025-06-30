#!/bin/bash

echo "📦 Building frontend..."
cd BackOffice && npm run build && cd ..

echo "🔨 Building backend (Windows binary)..."
# cd backend && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o app.exe && cd ..
cd backend && \
    GOOS=windows \
    GOARCH=amd64 \
    CGO_ENABLED=1 \
    CC=x86_64-w64-mingw32-gcc \
    go build -o app.exe && \
cd ..


echo "📁 Preparing build folder..."
rm -rf build
mkdir -p build
mkdir -p build/db

# Copy backend binary
cp backend/app.exe build/

# Copy database file if exists
if [ -f backend/db/data.db ]; then
  cp backend/db/data.db build/db/
  echo "✅ Copied database file: data.db"
fi

# Copy env file if exists
if [ -f backend/.env.dev ]; then
  cp backend/.env.dev build/.env.dev
  echo "✅ Copied env file: .env.dev"
fi

# Copy frontend build files
cp -r BackOffice/dist build/

echo "🚀 Done! Transfer the build/ folder to your Windows machine and run app.exe"
