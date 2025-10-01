#!/bin/bash

# HTML Prototype Builder - Quick Start Script
# This script helps you get started quickly

echo "🚀 HTML Prototype Builder - Quick Start"
echo "========================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Setup backend environment
echo "⚙️  Setting up backend configuration..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from example"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your LLM API key!"
    echo "   File location: backend/.env"
    echo "   Required: LLM_API_KEY=your_api_key_here"
    echo ""
else
    echo "✅ backend/.env already exists"
fi

# Setup frontend environment
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from example"
else
    echo "✅ frontend/.env already exists"
fi
echo ""

# Build shared package
echo "🔨 Building shared package..."
cd shared
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi
cd ..
echo "✅ Shared package built"
echo ""

# Final instructions
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your LLM API key"
echo "2. Run 'npm run dev' to start both servers"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 Documentation:"
echo "- GETTING_STARTED.md - Step-by-step tutorial"
echo "- SETUP.md - Detailed setup guide"
echo "- README.md - Project overview"
echo ""
echo "🎉 Happy prototyping!"

