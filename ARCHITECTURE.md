# Architecture Documentation

## Overview

The HTML Prototype Builder is a full-stack application designed to help Business Analysts and Product Owners create interactive HTML prototypes using natural language specifications. The application follows a modern, modular architecture with clear separation of concerns.

## Core Principles

### 1. Spec-Driven Development
- Users describe what they want in natural language
- AI converts specifications into structured HTML prototypes
- Iterative refinement through conversational interface

### 2. Local-First Architecture
- All prototype data stored in browser's IndexedDB
- No server-side database required
- Backend only handles AI generation requests
- Prototypes can be exported as standalone HTML files

### 3. Agentic UI Pattern
- Components are self-contained and intelligent
- Declarative approach to UI generation
- Progressive enhancement from simple to complex
- AI-assisted refinement and iteration

## Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **Dexie.js**: IndexedDB wrapper
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives

### Backend
- **Node.js + Express**: API server
- **TypeScript**: Type safety
- **Axios**: HTTP client for LLM APIs
- **Winston**: Logging
- **Zod**: Runtime validation

### Shared
- **TypeScript**: Shared type definitions
- **Zod**: Schema validation

## Architecture Layers

### 1. Data Layer (IndexedDB)

```
PrototypeDatabase
├── prototypes     # Main prototype documents
├── versions       # Version snapshots
├── comments       # Collaboration comments
└── specifications # Specification history
```

**Key Features:**
- Automatic indexing on key fields
- Efficient querying and filtering
- Version control through snapshots
- Offline-first capability

### 2. API Layer (Backend)

```
Express Server
├── /api/generate
│   ├── /prototype    # Generate complete prototype
│   ├── /page         # Generate single page
│   ├── /component    # Generate component
│   ├── /refine       # Refine existing content
│   └── /parse-spec   # Parse specification
└── /api/export       # Export prototypes
```

**Request Flow:**
1. Client sends specification + context
2. Controller validates request
3. Service layer calls LLM provider
4. Response parsed and enriched with IDs
5. Structured data returned to client

### 3. LLM Integration Layer

**Provider Architecture:**
```
ILLMProvider (Interface)
├── BaseLLMProvider (Abstract)
│   ├── DeepSeekProvider
│   ├── OpenAIProvider
│   ├── AnthropicProvider
│   └── OllamaProvider
└── LLMProviderFactory
```

**Key Features:**
- Provider abstraction for easy switching
- Unified request/response format
- Environment-based configuration
- Error handling and retry logic

### 4. State Management (Frontend)

**Zustand Store:**
```typescript
PrototypeStore
├── currentPrototype      # Active prototype
├── currentPageId         # Selected page
├── selectedComponentId   # Selected component
├── editorMode           # Current editor mode
├── sidebar visibility   # UI state
└── CRUD operations      # State mutations
```

**Data Flow:**
1. User action triggers store mutation
2. Store updates local state
3. UI re-renders reactively
4. Changes persisted to IndexedDB
5. Optional sync to backend for AI operations

### 5. Component Architecture (Frontend)

**Page Structure:**
```
App
├── HomePage
│   └── Prototype List + Creation
├── EditorPage
│   ├── Header (Navigation, Mode Selector)
│   ├── LeftSidebar (Page List)
│   ├── MainEditor
│   │   ├── SpecEditor
│   │   ├── VisualEditor
│   │   ├── CodeEditor
│   │   └── PreviewPanel
│   └── RightSidebar (Properties Panel)
└── PreviewPage
    └── Full Preview + Export
```

## Data Models

### Prototype
```typescript
{
  id: string
  name: string
  description?: string
  pages: Page[]
  globalStyles?: string
  globalScripts?: string
  assets?: Asset[]
  version: number
  createdAt: string
  updatedAt: string
  tags?: string[]
}
```

### Page
```typescript
{
  id: string
  name: string
  path: string
  title: string
  description?: string
  components: Component[]
  createdAt: string
  updatedAt: string
}
```

### Component
```typescript
{
  id: string
  type: ComponentType
  name: string
  content?: string
  props?: Record<string, any>
  styles?: Style
  children?: Component[]
  interactions?: Interaction[]
}
```

## AI Generation Flow

### 1. Prototype Generation
```
User Specification
    ↓
Parse Specification (Optional)
    ↓
Generate Prompt with Context
    ↓
LLM Provider Request
    ↓
Parse JSON Response
    ↓
Enrich with IDs & Timestamps
    ↓
Return Structured Prototype
    ↓
Save to IndexedDB
```

### 2. Refinement Flow
```
User Instruction
    ↓
Load Current State
    ↓
Generate Refinement Prompt
    ↓
LLM Provider Request
    ↓
Parse Updated Structure
    ↓
Merge with Existing Data
    ↓
Update IndexedDB
```

## Export System

### HTML Export Process
```
Prototype Data
    ↓
Generate HTML Structure
    ↓
Convert Components to HTML Tags
    ↓
Apply Inline Styles
    ↓
Add Navigation Script
    ↓
Combine into Single File
    ↓
Optional Minification
    ↓
Download as .html
```

**Generated HTML Features:**
- Standalone file (no external dependencies)
- Built-in navigation system
- Responsive design
- All styles inlined
- Interactive elements preserved

## Security Considerations

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Request validation with Zod
- API key stored server-side only
- No sensitive data in client

### Data Privacy
- All data stored locally in browser
- No server-side persistence
- Export creates portable files
- User controls all data

## Performance Optimizations

### Frontend
- Code splitting by route
- Lazy loading of editor components
- Virtual scrolling for large lists
- Debounced auto-save
- Optimistic UI updates

### Backend
- Request caching
- Connection pooling
- Compression middleware
- Efficient JSON parsing
- Timeout handling

### IndexedDB
- Indexed queries
- Batch operations
- Efficient filtering
- Lazy loading of large objects

## Extensibility Points

### Adding New Component Types
1. Add type to `ComponentTypeSchema` in shared/types
2. Update component renderer in frontend
3. Update HTML tag mapping in export service
4. Add to component palette (future)

### Adding New LLM Providers
1. Create provider class extending `BaseLLMProvider`
2. Implement `complete()` method
3. Add to `LLMProviderFactory`
4. Update environment configuration

### Adding New Export Formats
1. Create export method in `ExportService`
2. Add route handler
3. Update frontend export UI
4. Add format to `ExportRequest` schema

## Future Enhancements

### Planned Features
- [ ] Drag-and-drop visual editor
- [ ] Component library/templates
- [ ] Real-time collaboration
- [ ] Cloud sync (optional)
- [ ] Advanced styling editor
- [ ] Animation support
- [ ] Form validation
- [ ] API integration mockups
- [ ] User testing mode
- [ ] Analytics integration

### Scalability Considerations
- Implement pagination for large prototype lists
- Add search indexing for better performance
- Consider WebWorkers for heavy operations
- Implement progressive loading for large prototypes
- Add caching layer for frequently accessed data

## Development Workflow

### Adding a New Feature
1. Define types in `shared/src/types`
2. Implement backend service/controller
3. Add API route
4. Create frontend service wrapper
5. Build UI components
6. Update state management
7. Add tests
8. Update documentation

### Testing Strategy
- Unit tests for utilities and services
- Integration tests for API endpoints
- Component tests for UI
- E2E tests for critical flows
- Manual testing for AI generation

## Deployment

### Frontend Deployment
- Build: `npm run build`
- Output: `frontend/dist`
- Deploy to: Vercel, Netlify, or static hosting
- Environment variables via hosting platform

### Backend Deployment
- Build: `npm run build`
- Output: `backend/dist`
- Deploy to: Railway, Render, or Node.js hosting
- Set environment variables
- Ensure LLM API access

## Monitoring & Logging

### Backend Logging
- Winston logger with configurable levels
- Request/response logging
- Error tracking
- LLM usage metrics

### Frontend Monitoring
- Browser console for development
- Error boundaries for production
- Performance monitoring (optional)
- User analytics (optional)

## Conclusion

This architecture provides a solid foundation for building and scaling the HTML Prototype Builder. The modular design allows for easy extension and maintenance, while the local-first approach ensures user privacy and offline capability.

