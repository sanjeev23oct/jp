# Implementation Plan

This implementation plan breaks down the Lovable Visual Editor feature into discrete, manageable coding tasks. Each task builds incrementally on previous steps, following test-driven development principles where appropriate.

## Task List

- [x] 1. Set up History Store and Command Pattern Infrastructure



  - Create Zustand store for history management with undo/redo stacks
  - Implement base HistoryCommand interface with execute/undo/redo methods
  - Add keyboard shortcut handlers for Ctrl+Z and Ctrl+Y
  - Implement stack size limiting (max 50 entries) with automatic cleanup

  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.12_

- [x] 2. Implement History Command Classes

  - Create VisualEditCommand class with before/after snapshots
  - Create SurgicalEditCommand class for surgical edit tracking
  - Create AgentGenerationCommand class for AI generation tracking
  - Create ComponentInsertionCommand class for component additions


  - Implement snapshot creation and restoration logic
  - _Requirements: 13.1, 13.2, 13.3_


- [ ] 3. Integrate Undo/Redo with Existing Features
  - Add history tracking to visual editor (useVisualEditor hook)
  - Add history tracking to surgical edit service


  - Add history tracking to agent mode generation
  - Update EditorStore to work with history commands
  - Ensure preview updates correctly on undo/redo
  - _Requirements: 13.1, 13.2, 13.3, 13.6, 13.7_




- [ ] 4. Build History Timeline UI Component
  - Create HistoryTimeline component with scrollable list



  - Display command type icons and descriptions
  - Add timestamps with relative time formatting
  - Implement click-to-jump-to-point functionality
  - Add search/filter capability for history entries
  - Style with dark theme matching existing UI
  - _Requirements: 13.11_

- [ ] 5. Add Undo/Redo UI Controls
  - Add undo/redo buttons to toolbar
  - Implement button disabled states based on stack status
  - Add keyboard shortcut indicators to tooltips
  - Show current position in history visually

  - Add "Clear History" option with confirmation
  - _Requirements: 13.6, 13.7, 13.8, 13.9_

- [ ]* 5.1 Write unit tests for history system
  - Test command execute/undo/redo cycles
  - Test stack size limiting
  - Test redo stack clearing on new edit
  - Test snapshot creation and restoration
  - _Requirements: 13.1, 13.2, 13.3, 13.10, 13.12_

- [ ] 6. Implement Diff Algorithm
  - Create DiffEngine class with Myers' diff algorithm
  - Implement longest common subsequence (LCS) calculation
  - Build diff change list from LCS matrix
  - Add line-by-line comparison logic
  - Handle edge cases (empty files, identical files, large files)
  - _Requirements: 14.1_

- [ ] 7. Build Diff Viewer Component
  - Create DiffViewer component with side-by-side and inline views
  - Implement syntax highlighting using Monaco tokenizer
  - Add color coding for additions (green) and deletions (red)
  - Display unchanged context lines in gray
  - Add line numbers to both sides
  - Implement view mode toggle (side-by-side vs inline)
  - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.11, 14.12_

- [ ] 8. Add Interactive Diff Features
  - Implement expand/collapse for unchanged sections
  - Add hover tooltips showing change details
  - Implement click-to-jump-to-line in editor
  - Add word-level diff highlighting within lines
  - Implement search within diff
  - Add copy before/after snippets functionality
  - _Requirements: 14.13_

- [ ] 9. Integrate Diff Preview with Surgical Edits
  - Modify surgical edit service to return before/after code
  - Create SurgicalEditWithPreview wrapper component
  - Show diff preview modal before applying edits
  - Add "Apply Changes" and "Cancel" buttons
  - Implement multi-file diff tabs when multiple files affected
  - Update surgical edit flow to include preview step
  - _Requirements: 14.1, 14.6, 14.7, 14.8, 14.9, 14.10_

- [ ]* 9.1 Write unit tests for diff engine
  - Test diff algorithm correctness with various inputs
  - Test LCS calculation
  - Test edge cases (empty, identical, very different files)
  - Test performance with large files
  - _Requirements: 14.1_

- [ ] 10. Create Template Store and Data Models
  - Create Zustand store for template management
  - Define EditTemplate, TemplateParameter, and TemplateEdit interfaces
  - Implement template storage in IndexedDB
  - Add template CRUD operations (create, read, update, delete)
  - Implement template import/export as JSON
  - _Requirements: 15.9, 15.10, 15.11, 15.12, 15.13, 15.14_

- [ ] 11. Build Built-in Edit Templates
  - Create "Make Responsive" template with breakpoint parameters
  - Create "Add Dark Mode" template with color parameters
  - Create "Improve Accessibility" template with ARIA additions
  - Create "Add Animations" template with duration parameters
  - Create "Lazy Load Images" template for performance
  - Create "Add SEO Meta Tags" template
  - Implement parameter substitution logic for each template
  - _Requirements: 15.4, 15.5, 15.6, 15.7_

- [ ] 12. Build Template Library UI
  - Create TemplateLibrary component with categorized list
  - Implement search and filter functionality
  - Add template preview cards with descriptions
  - Create expandable categories (Responsive, Dark Mode, Accessibility, etc.)
  - Add favorites and recent templates sections
  - Style with consistent dark theme
  - _Requirements: 15.1, 15.2_

- [ ] 13. Create Template Parameter Form
  - Build dynamic form component based on template parameters
  - Implement input types (text, number, color, select, boolean)
  - Add parameter validation
  - Show parameter descriptions and defaults
  - Add preview of template with current parameters
  - Implement "Apply Template" button
  - _Requirements: 15.8_

- [ ] 14. Implement Template Application Logic
  - Create TemplateApplicationService to execute template edits
  - Generate surgical edits from template with parameters
  - Show diff preview before applying template
  - Apply all template edits atomically (all or nothing)
  - Add applied template to undo history
  - Handle template application errors gracefully
  - _Requirements: 15.3, 15.8_

- [ ] 15. Build Custom Template Creator
  - Create TemplateCreator component for recording edits
  - Implement edit recording mode
  - Allow defining template name, description, and category
  - Extract parameters from recorded edits
  - Generate template JSON structure
  - Add template testing with different parameters
  - Save custom template to user library
  - _Requirements: 15.9, 15.10, 15.11_

- [ ]* 15.1 Write unit tests for template system
  - Test parameter substitution
  - Test template validation
  - Test template import/export
  - Test atomic application (rollback on failure)
  - _Requirements: 15.3, 15.8, 15.13, 15.14_

- [ ] 16. Create Component Library Data Structure
  - Define Component, ComponentVariant, and ComponentProp interfaces
  - Create component library JSON with 50+ pre-built components
  - Organize components by category (Layout, Navigation, Forms, etc.)
  - Generate component thumbnails programmatically
  - Add component metadata (tags, responsive, accessible flags)
  - _Requirements: 16.16_

- [ ] 17. Build Component Categories
  - Create Layout components (Container, Grid, Flexbox, Section, etc.) - 10 components
  - Create Navigation components (Navbar, Sidebar, Breadcrumb, etc.) - 8 components
  - Create Form components (Input, Textarea, Select, Button, etc.) - 12 components
  - Create Data Display components (Table, List, Card, etc.) - 8 components
  - Create Feedback components (Alert, Toast, Modal, etc.) - 6 components
  - Create Media components (Image, Video, Gallery, Icon) - 4 components
  - Create Interactive components (Accordion, Carousel, Dropdown, etc.) - 6 components
  - Create E-commerce components (Product Card, Cart, etc.) - 4 components
  - Create Marketing components (Hero, Feature Grid, Testimonial, CTA) - 4 components
  - _Requirements: 16.16_

- [ ] 18. Build Component Palette UI
  - Create ComponentPalette component with categorized sections
  - Implement search functionality with fuzzy matching
  - Add filter tabs (All, Favorites, Recent)
  - Display component thumbnails in grid layout
  - Show component count per category
  - Add expand/collapse for categories
  - Implement favorites and recent tracking
  - _Requirements: 16.1, 16.2, 16.7_

- [ ] 19. Create Component Detail View
  - Build ComponentDetail modal showing full component info
  - Display live preview of component
  - Show available variants with thumbnails
  - Create property editor for component props
  - Add variant selector
  - Implement "Insert Component" button
  - Show usage examples and documentation
  - _Requirements: 16.3, 16.4, 16.9, 16.10_

- [ ] 20. Implement Drag and Drop System
  - Create DraggableComponent wrapper for palette items
  - Implement drag start with ghost element creation
  - Build useDropZones hook for iframe drop zone detection
  - Calculate valid drop zones (before, after, inside, replace)
  - Show visual drop indicators on hover
  - Implement drop handler with component insertion
  - Add drag preview following cursor
  - _Requirements: 16.5, 16.6, 16.7_

- [ ] 21. Build Component Insertion Service
  - Create ComponentInsertionService for surgical component insertion
  - Implement design system adaptation (colors, spacing, fonts)
  - Generate multi-file surgical edits (HTML, CSS, JS)
  - Handle component dependencies and scripts
  - Ensure responsive and accessible defaults
  - Add inserted component to undo history
  - _Requirements: 16.7, 16.8, 16.11_

- [ ] 22. Create Custom Component Creator
  - Build CustomComponentCreator UI for extracting components
  - Implement element selection mode for extraction
  - Extract HTML, CSS, and JS from selected elements
  - Create form for component metadata (name, category, description)
  - Define configurable props from extracted code
  - Generate component thumbnail automatically
  - Save custom component to personal library
  - _Requirements: 16.12_

- [ ] 23. Implement Component Export/Import
  - Create component export as JSON package
  - Include all dependencies (HTML, CSS, JS, assets)
  - Implement component import with validation
  - Handle dependency conflicts on import
  - Add component sharing functionality
  - Support bulk export/import of component libraries
  - _Requirements: 16.14, 16.15_

- [ ]* 23.1 Write unit tests for component system
  - Test component adaptation to design system
  - Test drop zone calculation
  - Test component insertion surgical edits
  - Test custom component extraction
  - Test component export/import
  - _Requirements: 16.7, 16.8, 16.12, 16.14, 16.15_

- [ ] 24. Enhance Visual Editor with Breadcrumb Navigation
  - Add breadcrumb trail showing element hierarchy
  - Implement click-to-select-parent functionality
  - Show element path from body to selected element
  - Add hover preview for breadcrumb items
  - Style breadcrumb with consistent UI theme
  - _Requirements: 1.7_

- [ ] 25. Add Tree View for Nested Element Selection
  - Create ElementTreeView component showing DOM structure
  - Implement expand/collapse for nested elements
  - Add click-to-select in tree view
  - Sync tree view selection with visual editor selection
  - Show element icons based on tag type
  - Add search/filter in tree view
  - _Requirements: 1.8_

- [ ] 26. Enhance Property Panel with Additional Categories
  - Add Effects category (shadow, opacity, transform, transition)
  - Add Interactions category (click actions, hover states, animations)
  - Improve visual box model display for spacing
  - Add color picker with design token suggestions
  - Implement preset values for common properties
  - Add "Reset to Default" option per property
  - _Requirements: 1.4_

- [ ] 27. Implement Batch Edit Support
  - Modify visual editor to support multi-select (Shift+Click)
  - Update property panel to show common properties
  - Apply property changes to all selected elements
  - Show "Mixed" state for properties with different values
  - Add "Apply to All" option for batch updates
  - _Requirements: 1.6_

- [ ] 28. Add Visual Feedback Improvements
  - Enhance hover outline with element tag name tooltip
  - Add resize handles for selected elements
  - Implement visual guides for alignment and spacing
  - Add snap-to-grid functionality (optional)
  - Show measurement tooltips when adjusting spacing
  - _Requirements: 1.2_

- [ ] 29. Integrate All Features into Main Application
  - Wire up history system with all edit operations
  - Connect diff preview to surgical edit flow
  - Integrate template library into main UI
  - Add component palette to sidebar
  - Ensure all features work together seamlessly
  - Update toolbar with new buttons and controls
  - _Requirements: All_

- [ ] 30. Add Comprehensive Error Handling
  - Implement error boundaries for React components
  - Add try-catch blocks for all async operations
  - Show user-friendly error messages
  - Implement rollback on failed operations
  - Add error logging and reporting
  - Create error recovery flows
  - _Requirements: 3.4, 3.8_

- [ ]* 30.1 Write integration tests
  - Test complete undo/redo cycle
  - Test template application with diff preview
  - Test drag and drop component insertion
  - Test multi-file surgical edits
  - Test error recovery flows
  - _Requirements: All_

- [ ]* 30.2 Write E2E tests
  - Test complete user journey: Generate → Edit → Template → Export
  - Test undo/redo across different edit types
  - Test template application with parameters
  - Test component drag and drop
  - Test custom component creation and reuse
  - _Requirements: All_

- [ ] 31. Performance Optimization
  - Implement virtual scrolling for component library
  - Add code splitting for heavy components (Monaco, Diff Viewer)
  - Optimize diff algorithm for large files
  - Add debouncing for visual edit updates
  - Implement IndexedDB caching for history and projects
  - Use Web Workers for diff computation
  - _Requirements: All_

- [ ] 32. Documentation and Polish
  - Add inline help tooltips for all features
  - Create user onboarding flow
  - Write comprehensive README for new features
  - Add keyboard shortcut reference
  - Create video tutorials for key features
  - Polish UI animations and transitions
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional unit/integration tests
- Each task should be completed and tested before moving to the next
- All tasks should preserve existing functionality
- Follow existing code style and patterns
- Use TypeScript for type safety
- Ensure accessibility compliance (WCAG 2.1 AA)
- Test on multiple browsers (Chrome, Firefox, Safari)
- Maintain responsive design across all viewports
