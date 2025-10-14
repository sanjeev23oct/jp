# Implementation Plan - EARS Requirements Mode

- [x] 1. Set up mode system and state management


  - Create mode store with Zustand for managing 'prototype' | 'ba' mode
  - Add mode persistence to localStorage
  - Update Project type to include 'type' and 'requirements' fields
  - Update database schema to support requirements projects
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_




- [ ] 2. Create Mode Switcher UI
  - Build ModeSwitch component in header
  - Add dropdown with "Prototype Mode" and "BA Mode" options
  - Implement mode toggle functionality



  - Add visual indicator for current mode
  - Style mode switcher to match existing UI
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Build BA View layout

  - Create BAView component
  - Implement split layout (Chat 40% | Editor 60%)
  - Add conditional rendering based on mode in EditorPage
  - Update chat placeholder text for BA mode
  - Hide prototype-specific UI elements in BA mode
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [x] 4. Implement Requirements Editor

  - Install Monaco Editor or CodeMirror
  - Create RequirementsEditor component
  - Add markdown syntax highlighting
  - Implement EARS keyword highlighting (WHEN, WHILE, IF, WHERE, SHALL)
  - Add line numbers and basic editor features
  - Integrate with auto-save (2 second debounce)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


- [ ] 5. Create Markdown Preview
  - Create MarkdownPreview component
  - Install markdown parser (marked or remark)
  - Implement real-time preview updates
  - Style markdown output for requirements
  - Add table of contents generation
  - Highlight EARS patterns in preview
  - _Requirements: 2.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_



- [ ] 6. Build EARS Templates Panel
  - Create EARSTemplatesPanel component
  - Add all 5 EARS pattern templates
  - Implement template insertion at cursor
  - Add examples and descriptions for each pattern

  - Add hover effects and tooltips
  - Make panel collapsible
  - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Create BA Mode AI Prompt
  - Create EARS-specific system prompt
  - Add EARS pattern examples to prompt
  - Include requirements formatting guidelines


  - Add user story generation instructions
  - Test prompt with various feature descriptions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Implement Requirements Generation
  - Update chat service to detect BA mode
  - Send EARS-specific prompt when in BA mode
  - Parse AI response and format as markdown
  - Insert generated requirements into editor
  - Handle streaming updates for requirements
  - Add loading states during generation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 9. Add Export Functionality
  - Create ExportModal component for BA mode
  - Implement Markdown export (.md file)
  - Implement HTML export (styled standalone file)
  - Add export button to BA view toolbar
  - Include project metadata in exports
  - Add success notifications after export
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [ ] 10. Implement PDF Export
  - Install PDF generation library (jsPDF or pdfmake)
  - Create PDF template for requirements
  - Format EARS patterns in PDF
  - Add page numbers and headers
  - Include table of contents in PDF
  - _Requirements: 7.1, 7.3, 7.6_

- [ ] 11. Implement Word Export
  - Install docx library
  - Create Word document template
  - Format requirements with proper styles
  - Add heading styles and numbering
  - Include metadata in document properties
  - _Requirements: 7.1, 7.4, 7.6_

- [ ] 12. Build Requirements Validation
  - Create validation engine for EARS patterns
  - Check for SHALL keyword in requirements
  - Detect ambiguous terms (fast, quickly, user-friendly, etc.)
  - Validate EARS pattern structure
  - Create ValidationPanel component
  - Display validation warnings inline
  - Add "Validate" button to toolbar
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 13. Add Project Templates
  - Create template data for common requirement types
  - Add templates: Web App, Mobile App, API, Integration, Data Migration
  - Update project creation flow to show templates in BA mode
  - Pre-populate projects with template content
  - Add template descriptions and previews
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 14. Implement Version History for Requirements (Optional - Not MVP)
  - Extend version system to support requirements
  - Create version snapshots on significant changes
  - Show diff view for requirements versions
  - Add restore functionality
  - Display version list in sidebar
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Add Comments System
  - Create Comment data model
  - Build CommentPanel component
  - Allow adding comments to specific requirements
  - Display comment indicators in editor
  - Show/hide comments panel
  - Include comments in exports (optional)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 16. Implement AI Refinement
  - Add "Refine" button for selected requirements
  - Create refinement prompt for AI
  - Show refinement suggestions in modal
  - Allow accept/reject for each suggestion
  - Check for missing edge cases
  - Suggest more specific language
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17. Update Database Schema
  - Add 'type' column to projects table ('prototype' | 'requirements')
  - Add 'requirements' TEXT column to projects table
  - Create migration script
  - Update project service to handle requirements field
  - Update API endpoints to support requirements projects
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 18. Update Project List UI
  - Add visual indicator for requirements projects
  - Show different icon for BA mode projects
  - Filter projects by type
  - Update project card to show requirements preview
  - Add "New Requirements Document" button
  - _Requirements: 1.1, 2.6_

- [ ] 19. Add Keyboard Shortcuts
  - Ctrl/Cmd+E: Toggle between edit and preview
  - Ctrl/Cmd+Shift+V: Validate requirements
  - Ctrl/Cmd+Shift+E: Export
  - Ctrl/Cmd+/: Insert comment
  - Ctrl/Cmd+T: Show templates panel
  - _Requirements: 5.2, 7.1, 8.1, 11.1_

- [ ] 20. Polish and Testing
  - Add loading states for all async operations
  - Implement error handling for validation
  - Add tooltips and help text
  - Test mode switching with data persistence
  - Test export in all formats
  - Test EARS pattern generation
  - Ensure accessibility (keyboard navigation, screen readers)
  - _Requirements: All_

- [ ] 21. Documentation
  - Create user guide for BA mode
  - Document EARS patterns with examples
  - Add export format documentation
  - Create video tutorial for BA workflow
  - Update README with BA mode features
  - _Requirements: All_
