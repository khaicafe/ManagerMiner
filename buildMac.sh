#!/bin/bash

echo "📦 Building frontend..."
cd BackOffice && npm run build && cd ..

echo "🔨 Building backend..."
cd backend && go build -o app && cd ..

echo "📁 Preparing build folder..."
rm -rf build
mkdir -p build
mkdir -p build/db

rm -rf AgentCoin-Server/server
mkdir -p AgentCoin-Server/server
mkdir -p AgentCoin-Server/server/db

# Copy backend binary
cp backend/app build/
cp backend/app.exe AgentCoin-Server/server

# Copy database file if exists
if [ -f backend/db/data.db ]; then
  cp backend/db/data.db build/db/
  echo "✅ Copied database file: data.db"
fi

# Copy env file if exists
if [ -f backend/.env.dev ]; then
  cp backend/.env.dev build/.env.dev
  cp backend/db/data.db AgentCoin-Server/server/db/
  echo "✅ Copied env file: .env.dev"
fi

# Copy frontend build files
cp -r BackOffice/dist build/
cp -r BackOffice/dist AgentCoin-Server/server

echo "🚀 Done! Run ./build/app to start full web + API server."

cd build
./app
