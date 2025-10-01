# HTML Prototype Builder

A Lovable.dev-inspired platform for creating interactive HTML prototypes, designed specifically for Business Analysts and Product Owners to quickly paint ideas into clickable prototypes.

## 🎯 Overview

This application enables non-technical users to create interactive HTML prototypes through natural language specifications. It's not meant to generate production-ready React code, but rather quick, clickable prototypes that can be shared with stakeholders and development teams.

## 🏗️ Architecture

```
jp/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-based modules
│   │   ├── services/      # API and IndexedDB services
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── llm/          # LLM integration layer
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── types/         # TypeScript types
│   └── tests/
└── shared/            # Shared types and utilities
```

## 🚀 Features

- **Spec-Driven Development**: Convert natural language specifications into HTML prototypes
- **Visual Editor**: Drag-and-drop interface with component palette
- **Click-Through Navigation**: Create interactive flows between pages
- **IndexedDB Storage**: All data stored locally in the browser
- **AI-Powered**: Configurable LLM integration (DeepSeek, OpenAI, etc.)
- **Export Capabilities**: Export prototypes as standalone HTML/CSS/JS
- **Version Control**: Track changes and revert to previous versions
- **Collaboration**: Share prototypes and gather feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** with **Vite** for fast development
- **TypeScript** for type safety
- **TanStack Query** for server state management
- **Zustand** for client state management
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **IndexedDB** via Dexie.js for local storage

### Backend
- **Node.js** with **Express**
- **TypeScript**
- **Generic LLM Adapter** supporting multiple providers
- **Zod** for validation
- **Winston** for logging

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Modern browser with IndexedDB support

## 🔧 Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development

# LLM Configuration
LLM_PROVIDER=deepseek  # Options: deepseek, openai, anthropic, ollama
LLM_API_KEY=your_api_key_here
LLM_MODEL=deepseek-chat  # Model name based on provider
LLM_BASE_URL=https://api.deepseek.com  # Optional: for custom endpoints

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=HTML Prototype Builder
```

## 🚦 Getting Started

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 📖 Usage

1. **Create a New Prototype**: Start with a natural language specification
2. **AI Generation**: The AI converts your spec into HTML components
3. **Visual Editing**: Refine using the drag-and-drop editor
4. **Add Interactions**: Create click-through flows between pages
5. **Preview & Test**: Test your prototype in real-time
6. **Export & Share**: Export as HTML or share a link

## 🎨 Agentic UI Pattern

The application follows the Agentic UI pattern:
- **Autonomous Components**: Self-contained, intelligent components
- **Declarative Interactions**: Describe what you want, not how to build it
- **Progressive Enhancement**: Start simple, add complexity as needed
- **Feedback Loops**: Continuous refinement through AI assistance

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

