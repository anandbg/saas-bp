# Phase 3: Frontend Development - Task Breakdown

**Phase**: Frontend Development
**Timeline**: Week 2 (per design document)
**Status**: Ready to start
**Dependencies**: Phase 2 (Foundation) complete ✅

---

## 🎯 Phase Objectives

Build the complete user interface for the AI Diagram Generator, including:
1. Main application page layout
2. Chat interface for conversational interactions
3. File upload with drag-and-drop
4. Diagram preview with sandboxed rendering
5. Export panel with multiple format options

---

## 📋 Task List

### Task 3.1: Set Up Component Structure
**Priority**: P0 (Blocking)
**Estimated Time**: 30 minutes
**Assignee**: Frontend Expert

#### Description
Create the base directory structure and shared component utilities.

#### Acceptance Criteria
- [ ] Create `components/diagram/` directory
- [ ] Create `components/ui/` directory (if not exists)
- [ ] Set up shared TypeScript types in `types/diagram.ts`
- [ ] Set up component exports in index files

#### Files to Create
- `components/diagram/index.ts` (export all components)
- `types/diagram.ts` (shared types)

#### Definition of Done
- Directory structure matches design document
- All necessary directories exist
- Index files export components properly

---

### Task 3.2: Build ChatInterface Component
**Priority**: P0 (Core feature)
**Estimated Time**: 3-4 hours
**Assignee**: Frontend Expert
**Dependencies**: Task 3.1

#### Description
Build the chat interface that displays conversation history and accepts user input for diagram requests.

#### Technical Specifications
- **File**: `components/diagram/ChatInterface.tsx`
- **Component Type**: Client component (`'use client'`)
- **Styling**: Tailwind CSS
- **State Management**: Local state (will integrate with hooks later)

#### Features Required
1. **Message Display**
   - Display conversation history (user messages + assistant responses)
   - Different styling for user vs assistant messages
   - Timestamp display (optional)
   - Auto-scroll to latest message

2. **Input Area**
   - Multiline textarea for user input
   - "Generate Diagram" button
   - Character count (optional)
   - Keyboard shortcuts (Enter to send, Shift+Enter for newline)

3. **Loading States**
   - Show loading indicator when generating
   - Disable input during generation
   - Display "Generating diagram..." message

4. **Error Handling**
   - Display error messages inline
   - Retry button for failed generations
   - Clear error on new input

5. **Conversation Persistence**
   - Accept conversation history as prop
   - Emit events on new message
   - Support clearing conversation

#### Props Interface
```typescript
interface ChatInterfaceProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
  isLoading: boolean;
  error?: string;
}
```

#### Acceptance Criteria
- [ ] Component renders with empty state (no messages)
- [ ] Component renders with message history
- [ ] User can type multiline input
- [ ] User can send message via button or Enter key
- [ ] Loading state disables input and shows indicator
- [ ] Error messages display correctly
- [ ] Auto-scrolls to latest message on new message
- [ ] Clear conversation button works
- [ ] Component is fully typed with TypeScript
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Component uses Tailwind CSS (no separate CSS files)

#### Design Reference
- Style: Modern, clean chat interface
- Inspiration: Linear, Vercel, Stripe aesthetic
- Colors: Subtle grays, blue accent for user messages
- Font: System font stack, tight tracking for titles
- Spacing: Generous padding, subtle dividers

#### Definition of Done
- Component built and exported
- All acceptance criteria met
- TypeScript types defined
- Responsive on all screen sizes
- Accessible (keyboard navigation, ARIA labels)

---

### Task 3.3: Build FileUpload Component
**Priority**: P0 (Core feature)
**Estimated Time**: 4-5 hours
**Assignee**: Frontend Expert
**Dependencies**: Task 3.1

#### Description
Build the file upload component with drag-and-drop support for multiple file types.

#### Technical Specifications
- **File**: `components/diagram/FileUpload.tsx`
- **Component Type**: Client component (`'use client'`)
- **Library**: react-dropzone (already installed)
- **Styling**: Tailwind CSS
- **File Types**: 7 formats (text, images, PDF, PPT, DOCX, XLSX, CSV)

#### Features Required
1. **Drag-and-Drop Zone**
   - Visual drop zone with dashed border
   - Hover state when dragging over
   - Click to open file picker
   - Support multiple file selection

2. **File Validation**
   - Validate file types (7 accepted formats)
   - Validate file size (10MB per file, 50MB total)
   - Display validation errors inline
   - Prevent upload if validation fails

3. **File Preview**
   - Display uploaded file list with thumbnails
   - Show file name, size, type
   - Remove button for each file
   - Reorder files (drag-and-drop, optional)

4. **Upload Progress**
   - Show upload progress for each file (if async upload)
   - Success/failure status indicators
   - Retry button for failed uploads

5. **File Parsing Feedback**
   - Show "Parsing..." status
   - Display parsed content preview (optional)
   - Show parsing errors if any

#### Props Interface
```typescript
interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onFilesRemove: (fileIndexes: number[]) => void;
  maxFiles?: number; // Default: 10
  maxFileSize?: number; // Default: 10MB
  maxTotalSize?: number; // Default: 50MB
  acceptedFileTypes?: string[]; // Default: 7 formats
  disabled?: boolean;
  error?: string;
}
```

#### Accepted File Types
```typescript
const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
};
```

#### Acceptance Criteria
- [ ] Drag-and-drop zone renders correctly
- [ ] User can drag files onto zone
- [ ] User can click to open file picker
- [ ] Multiple files can be selected
- [ ] File type validation works (only 7 formats accepted)
- [ ] File size validation works (10MB per file)
- [ ] Total size validation works (50MB total)
- [ ] File list displays with thumbnails (or icons)
- [ ] User can remove individual files
- [ ] Validation errors display clearly
- [ ] Component is fully typed with TypeScript
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Component uses Tailwind CSS

#### Design Reference
- Style: Dashed border drop zone, subtle hover effect
- File cards: Clean, minimal with remove button
- Icons: Use Lucide icons (Upload, X, FileText, Image, etc.)
- Colors: Gray borders, blue accent on drag-over
- Feedback: Green check for valid files, red X for errors

#### Definition of Done
- Component built and exported
- All acceptance criteria met
- TypeScript types defined
- File validation works correctly
- Responsive on all screen sizes
- Accessible (keyboard navigation, screen reader support)

---

### Task 3.4: Build DiagramPreview Component
**Priority**: P0 (Core feature)
**Estimated Time**: 3-4 hours
**Assignee**: Frontend Expert
**Dependencies**: Task 3.1

#### Description
Build the diagram preview component that renders generated HTML diagrams in a sandboxed iframe.

#### Technical Specifications
- **File**: `components/diagram/DiagramPreview.tsx`
- **Component Type**: Client component (`'use client'`)
- **Rendering**: Sandboxed iframe for security
- **Styling**: Tailwind CSS

#### Features Required
1. **Iframe Rendering**
   - Render HTML in sandboxed iframe
   - Security: `sandbox="allow-scripts allow-same-origin"`
   - Responsive iframe container
   - Auto-resize to content height (if possible)

2. **Zoom Controls**
   - Zoom in button (+)
   - Zoom out button (-)
   - Reset zoom button (100%)
   - Zoom level display (e.g., "125%")

3. **View Controls**
   - Full-screen mode toggle
   - Refresh/reload button
   - Download button (delegates to ExportPanel)

4. **Loading State**
   - Skeleton loader while HTML is rendering
   - Loading spinner
   - "Generating diagram..." message

5. **Error Handling**
   - Error boundary for iframe crashes
   - Display error message if HTML invalid
   - Retry button

6. **Empty State**
   - Display when no diagram generated yet
   - "Upload files and describe what you want to create" message
   - Icon illustration

#### Props Interface
```typescript
interface DiagramPreviewProps {
  html: string | null;
  isLoading: boolean;
  error?: string;
  onReload?: () => void;
  onFullScreen?: () => void;
  onDownload?: () => void;
}
```

#### Acceptance Criteria
- [ ] Component renders empty state when no HTML
- [ ] Component renders loading state correctly
- [ ] HTML renders in sandboxed iframe
- [ ] Iframe is sandboxed for security
- [ ] Zoom controls work (in/out/reset)
- [ ] Full-screen mode works
- [ ] Reload button refreshes iframe
- [ ] Error state displays correctly
- [ ] Error boundary catches iframe errors
- [ ] Component is fully typed with TypeScript
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Component uses Tailwind CSS

#### Design Reference
- Style: Clean preview area with subtle border
- Controls: Minimal icon buttons at top-right
- Zoom: Display current zoom level
- Full-screen: Overlay with dark background
- Empty state: Centered icon + text

#### Security Considerations
- Use `sandbox` attribute on iframe
- Do not use `allow-top-navigation`
- Validate HTML before rendering (already done in backend)
- Use CSP headers if possible

#### Definition of Done
- Component built and exported
- All acceptance criteria met
- TypeScript types defined
- Sandboxed iframe works securely
- Responsive on all screen sizes
- Accessible (keyboard shortcuts, ARIA labels)

---

### Task 3.5: Build ExportPanel Component
**Priority**: P1 (High priority, not blocking)
**Estimated Time**: 3-4 hours
**Assignee**: Frontend Expert
**Dependencies**: Task 3.1

#### Description
Build the export panel with buttons for exporting diagrams in multiple formats.

#### Technical Specifications
- **File**: `components/diagram/ExportPanel.tsx`
- **Component Type**: Client component (`'use client'`)
- **Styling**: Tailwind CSS
- **Export Formats**: PPTX, PDF, PNG, HTML file, Clipboard

#### Features Required
1. **Export Buttons**
   - "Export to PPTX" button
   - "Export to PDF" button
   - "Export to PNG" button
   - "Download HTML" button
   - "Copy to Clipboard" button

2. **Button States**
   - Disabled when no diagram available
   - Loading state during export
   - Success feedback (checkmark, "Copied!" message)
   - Error feedback if export fails

3. **Progress Indicators**
   - Show progress for long exports (PDF, PPTX)
   - Spinner or progress bar
   - Cancel button (optional)

4. **Export Options (Optional)**
   - Quality settings for PNG (low/medium/high)
   - Page size for PDF (A4/Letter/Custom)
   - Slide size for PPTX (16:9/4:3)

5. **Batch Export (Future)**
   - Export multiple diagrams at once
   - ZIP download for batch export

#### Props Interface
```typescript
interface ExportPanelProps {
  html: string | null;
  onExportPPTX: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onExportPNG: () => Promise<void>;
  onExportHTML: () => void;
  onCopyClipboard: () => Promise<void>;
  disabled?: boolean;
}
```

#### Acceptance Criteria
- [ ] Component renders with all 5 export buttons
- [ ] Buttons are disabled when no diagram available
- [ ] Each button triggers corresponding export function
- [ ] Loading state displays during export
- [ ] Success feedback shows after export
- [ ] Error feedback shows if export fails
- [ ] Clipboard copy shows "Copied!" confirmation
- [ ] Component is fully typed with TypeScript
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Component uses Tailwind CSS

#### Design Reference
- Style: Horizontal button row or vertical stack (mobile)
- Icons: Use Lucide icons (FileDown, Clipboard, Image, etc.)
- Buttons: Primary button style, subtle shadows
- Feedback: Toast notification or inline message
- Spacing: Generous padding between buttons

#### Definition of Done
- Component built and exported
- All acceptance criteria met
- TypeScript types defined
- All export buttons functional (even if stubs)
- Responsive on all screen sizes
- Accessible (keyboard shortcuts, ARIA labels)

---

### Task 3.6: Build Main Application Page
**Priority**: P0 (Integration)
**Estimated Time**: 2-3 hours
**Assignee**: Frontend Expert
**Dependencies**: Tasks 3.2, 3.3, 3.4, 3.5

#### Description
Build the main application page that integrates all components into a cohesive layout.

#### Technical Specifications
- **File**: `app/page.tsx`
- **Component Type**: Server component (wraps client components)
- **Layout**: Responsive grid or flex layout
- **Styling**: Tailwind CSS

#### Features Required
1. **Page Layout**
   - Header with app title/logo
   - Main content area with 2-column layout (desktop)
   - Left column: ChatInterface + FileUpload
   - Right column: DiagramPreview + ExportPanel
   - Single column on mobile (stack vertically)

2. **Component Integration**
   - Integrate ChatInterface
   - Integrate FileUpload
   - Integrate DiagramPreview
   - Integrate ExportPanel
   - Wire up all component interactions

3. **State Management**
   - Manage conversation history
   - Manage uploaded files
   - Manage current diagram HTML
   - Manage loading/error states

4. **API Integration**
   - Call `/api/diagram/generate` endpoint
   - Handle file uploads in FormData
   - Handle API responses
   - Handle API errors

5. **User Flow**
   - User uploads files (optional)
   - User types request in chat
   - System generates diagram
   - User previews diagram
   - User exports diagram or iterates

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Header (App Title, Logo)              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌─────────────────────┐ │
│  │  Chat    │  │  Diagram Preview    │ │
│  │          │  │                     │ │
│  │          │  │                     │ │
│  ├──────────┤  ├─────────────────────┤ │
│  │  Files   │  │  Export Panel       │ │
│  └──────────┘  └─────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] Page renders with all 4 components
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] Components are wired up correctly
- [ ] User can upload files
- [ ] User can send chat messages
- [ ] API endpoint is called on "Generate"
- [ ] Diagram renders in preview
- [ ] Export buttons work
- [ ] Error handling works end-to-end
- [ ] Loading states display correctly
- [ ] Page is fully typed with TypeScript
- [ ] Page uses Tailwind CSS

#### Design Reference
- Style: Clean, modern, spacious
- Header: Minimal, logo + title + optional nav
- Layout: Balanced columns, responsive
- Colors: Light background, subtle borders
- Typography: System fonts, tight tracking

#### Definition of Done
- Main page built and functional
- All components integrated
- API integration complete
- All acceptance criteria met
- Responsive on all screen sizes
- Accessible (semantic HTML, ARIA labels)

---

## 🎯 Success Criteria for Phase 3

- [ ] All 5 components built with TypeScript
- [ ] Components follow design document specifications
- [ ] Tailwind CSS styling matches modern aesthetic (Linear/Stripe/Vercel)
- [ ] Components are responsive (mobile/tablet/desktop tested)
- [ ] Basic error handling in place for all components
- [ ] Main page integrates all components successfully
- [ ] End-to-end user flow works: Upload → Chat → Generate → Preview → Export
- [ ] All components committed with conventional commit messages
- [ ] No TypeScript errors or warnings
- [ ] No console errors in browser

---

## 📦 Deliverables

### Code Files
1. `components/diagram/ChatInterface.tsx`
2. `components/diagram/FileUpload.tsx`
3. `components/diagram/DiagramPreview.tsx`
4. `components/diagram/ExportPanel.tsx`
5. `components/diagram/index.ts` (exports)
6. `app/page.tsx` (main page)
7. `types/diagram.ts` (shared types)

### Git Commits
- `feat(ui): Add ChatInterface component for diagram conversations`
- `feat(ui): Add FileUpload component with drag-and-drop support`
- `feat(ui): Add DiagramPreview component with sandboxed rendering`
- `feat(ui): Add ExportPanel component with multi-format export`
- `feat(ui): Add main application page integrating all components`

### Documentation Updates
- Update `DIAGRAM-GENERATOR-STATUS.md` to mark Phase 3 complete
- Add screenshots to documentation (optional)

---

## 🚀 Next Phase

After Phase 3 completion, proceed to:
- **Phase 4**: State Management (hooks, sessionStorage, caching)
- **Phase 5**: Export Functionality (implement actual export logic)
- **Phase 6**: Testing (unit, integration, E2E)

---

**Created**: January 2025
**Phase Timeline**: Week 2
**Total Estimated Time**: 15-20 hours
