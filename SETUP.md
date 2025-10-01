# Setup Guide - HTML Prototype Builder

This guide will help you set up and run the HTML Prototype Builder application.

## Prerequisites

- **Node.js** 18+ and npm 9+
- A modern web browser with IndexedDB support
- An API key for your chosen LLM provider (DeepSeek, OpenAI, Anthropic, or Ollama)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# This will automatically install dependencies for all workspaces:
# - frontend
# - backend
# - shared
```

### 2. Configure Environment Variables

#### Backend Configuration

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure your LLM provider:

**For DeepSeek (Default):**
```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_deepseek_api_key
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
```

**For OpenAI:**
```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-your_openai_api_key
LLM_MODEL=gpt-4-turbo-preview
```

**For Anthropic:**
```env
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-your_anthropic_api_key
LLM_MODEL=claude-3-sonnet-20240229
```

**For Ollama (Local):**
```env
LLM_PROVIDER=ollama
LLM_MODEL=llama2
LLM_BASE_URL=http://localhost:11434
# No API key needed for Ollama
```

#### Frontend Configuration

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

The default configuration should work for local development:
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=HTML Prototype Builder
```

### 3. Build Shared Package

The shared package contains TypeScript types used by both frontend and backend:

```bash
cd shared
npm run build
```

### 4. Start Development Servers

You can start both servers with a single command from the root:

```bash
npm run dev
```

Or start them individually:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Project Structure

```
jp/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── ui/       # Base UI components (Button, Input, etc.)
│   │   │   └── editor/   # Editor-specific components
│   │   ├── pages/        # Page components (Home, Editor, Preview)
│   │   ├── services/     # API and IndexedDB services
│   │   ├── store/        # Zustand state management
│   │   └── lib/          # Utility functions
│   └── public/
│
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── llm/         # LLM integration layer
│   │   │   └── providers/ # Provider implementations
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── config/       # Configuration
│   │   └── utils/        # Utilities
│   └── tests/
│
└── shared/               # Shared TypeScript types
    └── src/
        ├── types/        # Type definitions
        └── utils/        # Shared utilities
```

## Usage

### Creating Your First Prototype

1. **Open the application** at http://localhost:5173
2. **Click "New Prototype"**
3. **Enter a specification**, for example:
   ```
   Create a landing page for a SaaS product with:
   - A hero section with headline and CTA button
   - A features section with 3 feature cards
   - A pricing table with 3 tiers
   - A footer with links
   ```
4. **Click "Generate from Spec"** and wait for the AI to create your prototype
5. **Edit and refine** using the visual editor or spec editor

### Editor Modes

- **Spec Mode**: Use natural language to generate or refine content
- **Visual Mode**: Click and edit components visually
- **Code Mode**: View and copy the JSON structure
- **Preview Mode**: See the final rendered prototype

### Exporting Prototypes

1. Open a prototype in the editor
2. Click the "Preview" button
3. Click "Export HTML" to download a standalone HTML file
4. Share the HTML file with stakeholders

## Development

### Running Tests

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

### Building for Production

```bash
# Build all packages
npm run build

# Or build individually
cd frontend && npm run build
cd backend && npm run build
```

### Linting

```bash
# Lint all packages
npm run lint

# Or lint individually
cd frontend && npm run lint
cd backend && npm run lint
```

## Troubleshooting

### Backend won't start

- Check that your `.env` file is configured correctly
- Verify your LLM API key is valid
- Check that port 3001 is not in use

### Frontend can't connect to backend

- Ensure the backend is running on port 3001
- Check the `VITE_API_URL` in `frontend/.env`
- Look for CORS errors in the browser console

### LLM requests failing

- Verify your API key is correct
- Check your internet connection
- Ensure you have sufficient API credits
- For Ollama, make sure the Ollama service is running

### IndexedDB errors

- Clear your browser's IndexedDB storage
- Try a different browser
- Check browser console for specific errors

## API Endpoints

### Generation Endpoints

- `POST /api/generate/prototype` - Generate a complete prototype
- `POST /api/generate/page` - Generate a single page
- `POST /api/generate/component` - Generate a component
- `POST /api/generate/refine` - Refine existing content
- `POST /api/generate/parse-spec` - Parse a specification

### Export Endpoints

- `POST /api/export` - Export prototype as HTML or JSON

### Health Check

- `GET /api/health` - Check API status

## Next Steps

- Explore the codebase and customize components
- Add new component types in `shared/src/types/prototype.ts`
- Extend the LLM prompts in `backend/src/llm/prompts.ts`
- Add new UI components in `frontend/src/components/ui/`
- Implement additional export formats
- Add collaboration features

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the code comments and documentation
3. Check the browser and server console logs

## License

MIT

