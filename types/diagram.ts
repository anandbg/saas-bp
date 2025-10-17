/**
 * TypeScript types for AI Diagram Generator
 *
 * Defines interfaces for diagram generation, file parsing, validation,
 * and conversation management.
 */

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  files?: FileMetadata[];
}

export interface FileMetadata {
  name: string;
  size: number;
  type?: string;
}

// ============================================================================
// Diagram Generation Types
// ============================================================================

export interface GenerateRequest {
  userRequest: string;
  files?: File[];
  conversationHistory?: Message[];
  previousDiagrams?: GeneratedDiagram[];
  enableValidation?: boolean;
  maxIterations?: number;
}

export interface GeneratedDiagram {
  id: string;
  html: string;
  metadata: DiagramMetadata;
  timestamp: Date;
}

export interface DiagramMetadata {
  model: string;
  tokensUsed: number;
  generationTime: number;
  validationPassed: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  iterations?: number;
}

export interface GenerateResponse {
  success: boolean;
  html?: string;
  error?: string;
  code?: string;
  metadata: DiagramMetadata;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt', '.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
} as const;

export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 10,
} as const;

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  screenshot?: string; // base64
  timestamp: Date;
}

export interface ValidationError {
  type: 'structural' | 'console' | 'responsive' | 'accessibility' | 'visual';
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: string;
  message: string;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'pptx' | 'pdf' | 'png' | 'html' | 'clipboard';

export interface ExportOptions {
  filename?: string;
  transparentBackground?: boolean; // PNG only
  quality?: number; // PNG/PDF (1-100)
  slideSize?: '16:9' | '4:3'; // PPTX only
}

export interface ExportRequest {
  html: string;
  format: ExportFormat;
  options?: ExportOptions;
}

// ============================================================================
// Conversation/Session Types
// ============================================================================

export interface Conversation {
  id: string;
  messages: Message[];
  diagrams: GeneratedDiagram[];
  timestamp: Date;
}

export interface SessionState {
  conversations: Conversation[];
  currentConversationId: string | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
  isLoading: boolean;
  error?: string;
}

export interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onFilesRemove: (fileIndexes: number[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  maxTotalSize?: number;
  disabled?: boolean;
  error?: string;
}

export interface DiagramPreviewProps {
  html: string | null;
  isLoading: boolean;
  error?: string;
  onReload?: () => void;
  onFullScreen?: () => void;
  onDownload?: () => void;
}

export interface ExportPanelProps {
  html: string | null;
  onExportPPTX: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onExportPNG: () => Promise<void>;
  onExportHTML: () => void;
  onCopyClipboard: () => Promise<void>;
  disabled?: boolean;
}

// ============================================================================
// API Error Types
// ============================================================================

export type ApiErrorCode =
  | 'validation_error'
  | 'invalid_files'
  | 'parsing_error'
  | 'missing_api_key'
  | 'internal_error';

export interface ApiError {
  success: false;
  error: string;
  code: ApiErrorCode;
  details?: unknown;
}
