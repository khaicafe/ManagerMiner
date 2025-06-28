#!/bin/bash

echo "📦 Building frontend..."
cd frontend && npm run build && cd ..

echo "🔨 Building backend..."
cd backend && go build -o app && cd ..

echo "📁 Preparing build folder..."
rm -rf build
mkdir -p build
mkdir -p build/db

# Copy backend binary
cp backend/app build/

# Copy database file if exists
if [ -f backend/db/data.db ]; then
  cp backend/db/data.db build/db/
  echo "✅ Copied database file: data.db"
fi

# Copy frontend build files
cp -r frontend/dist build/

echo "🚀 Done! Run ./build/app to start full web + API server."

cd build
./app