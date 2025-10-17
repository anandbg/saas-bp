'use client';

/**
 * AI Diagram Generator - Main Application Page (Redesigned)
 *
 * Complete UI redesign following Linear/Stripe/Vercel aesthetic:
 * - Two-panel layout (Chat left, Diagram right)
 * - Integrated file upload inside chat panel
 * - Integrated export controls in diagram header
 * - White background with subtle borders
 * - Thinner font weights (semibold instead of bold)
 * - Tracking-tight for large text
 * - 1.5 strokeWidth for all icons
 *
 * Preserves ALL existing functionality:
 * - useConversation for message history with persistence
 * - useDiagramGeneration for AI generation with retry logic
 * - File upload with validation
 * - Export to PPTX, PDF, PNG, HTML
 * - Copy to clipboard
 * - Loading states and error handling
 */

import { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  ArrowRight,
  Paperclip,
  Layout,
  Maximize2,
  FileText,
  Presentation,
  Image as ImageIcon,
  Code,
  Copy,
  RefreshCw,
  Loader2,
  AlertCircle,
  Upload,
  X,
  File,
  FileX,
} from 'lucide-react';
import { useConversation } from '@/hooks/useConversation';
import { useDiagramGeneration } from '@/hooks/useDiagramGeneration';
import { useDropzone } from 'react-dropzone';
import { ACCEPTED_FILE_TYPES, FILE_VALIDATION } from '@/types/diagram';

export default function Home() {
  // Conversation management with persistence
  const { messages, addMessage, clearConversation } = useConversation();

  // Diagram generation with retry logic
  const {
    isGenerating,
    error,
    currentDiagram,
    metadata,
    generate,
    setDiagram,
  } = useDiagramGeneration();

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Message input state
  const [inputValue, setInputValue] = useState('');

  // Export state for loading and error feedback
  const [exportStatus, setExportStatus] = useState<{
    format: string | null;
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({ format: null, loading: false, error: null, success: false });

  /**
   * Handle sending a message and generating a diagram
   */
  const handleSendMessage = async () => {
    const userMessage = inputValue.trim();
    if (userMessage.length < 10) {
      return;
    }

    // Clear input immediately
    setInputValue('');

    // Add user message to conversation
    addMessage({
      role: 'user',
      content: userMessage,
      files: files.length > 0 ? files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })) : undefined,
    });

    // Generate diagram using the hook (includes retry logic)
    const result = await generate({
      userRequest: userMessage,
      files: files.length > 0 ? files : undefined,
      conversationHistory: messages,
      enableValidation: false,
      maxIterations: 5,
    });

    if (result && result.success) {
      // Add success message to conversation
      addMessage({
        role: 'assistant',
        content: `Generated diagram successfully! ${metadata ? `(Model: ${metadata.model}, Tokens: ${metadata.tokensUsed})` : ''}`,
      });

      // Clear files after successful generation
      setFiles([]);
      setShowFileUpload(false);
    } else {
      // Add error message to conversation (error is already set by useDiagramGeneration)
      addMessage({
        role: 'assistant',
        content: `Error: ${error || 'Failed to generate diagram'}`,
      });
    }
  };

  /**
   * Handle clearing the conversation
   */
  const handleClearConversation = () => {
    clearConversation();
    setDiagram(null);
    setFiles([]);
    setFileError(undefined);
    setShowFileUpload(false);
  };

  /**
   * Handle keyboard events in textarea
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  /**
   * File upload handlers
   */
  const onDrop = (acceptedFiles: File[]) => {
    // Check total file count
    if (files.length + acceptedFiles.length > FILE_VALIDATION.MAX_FILES) {
      setFileError(`Maximum ${FILE_VALIDATION.MAX_FILES} files allowed`);
      return;
    }

    // Check individual file sizes
    const validFiles = acceptedFiles.filter(
      (file: File) => file.size <= FILE_VALIDATION.MAX_FILE_SIZE
    );

    if (validFiles.length < acceptedFiles.length) {
      setFileError(`Some files exceed ${FILE_VALIDATION.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Check total size
    const currentTotalSize = files.reduce((sum: number, file: File) => sum + file.size, 0);
    const newTotalSize = validFiles.reduce(
      (sum: number, file: File) => sum + file.size,
      currentTotalSize
    );

    if (newTotalSize > FILE_VALIDATION.MAX_TOTAL_SIZE) {
      setFileError(`Total size exceeds ${FILE_VALIDATION.MAX_TOTAL_SIZE / (1024 * 1024)}MB limit`);
      return;
    }

    setFiles([...files, ...validFiles] as File[]);
    setFileError(undefined);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    disabled: isGenerating,
    maxFiles: FILE_VALIDATION.MAX_FILES,
    maxSize: FILE_VALIDATION.MAX_FILE_SIZE,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Export handlers (preserve all existing logic)
   */
  const handleExportPPTX = async () => {
    if (!currentDiagram) return;

    setExportStatus({ format: 'PPTX', loading: true, error: null, success: false });

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentDiagram, format: 'pptx' }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }
        throw new Error(`Export failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
        throw new Error('Invalid response format. Expected PPTX file.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus({ format: 'PPTX', loading: false, error: null, success: true });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PPTX export failed';
      console.error('PPTX export failed:', err);
      setExportStatus({ format: 'PPTX', loading: false, error: errorMessage, success: false });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 5000);
    }
  };

  const handleExportPDF = async () => {
    if (!currentDiagram) return;

    setExportStatus({ format: 'PDF', loading: true, error: null, success: false });

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentDiagram, format: 'pdf' }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }
        throw new Error(`Export failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error('Invalid response format. Expected PDF file.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus({ format: 'PDF', loading: false, error: null, success: true });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed';
      console.error('PDF export failed:', err);
      setExportStatus({ format: 'PDF', loading: false, error: errorMessage, success: false });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 5000);
    }
  };

  const handleExportPNG = async () => {
    if (!currentDiagram) return;

    setExportStatus({ format: 'PNG', loading: true, error: null, success: false });

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentDiagram, format: 'png' }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }
        throw new Error(`Export failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('image/png')) {
        throw new Error('Invalid response format. Expected PNG file.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus({ format: 'PNG', loading: false, error: null, success: true });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PNG export failed';
      console.error('PNG export failed:', err);
      setExportStatus({ format: 'PNG', loading: false, error: errorMessage, success: false });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 5000);
    }
  };

  const handleExportHTML = async () => {
    if (!currentDiagram) return;

    setExportStatus({ format: 'HTML', loading: true, error: null, success: false });

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentDiagram, format: 'html' }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }
        throw new Error(`Export failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/html')) {
        throw new Error('Invalid response format. Expected HTML file.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus({ format: 'HTML', loading: false, error: null, success: true });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'HTML export failed';
      console.error('HTML export failed:', err);
      setExportStatus({ format: 'HTML', loading: false, error: errorMessage, success: false });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 5000);
    }
  };

  const handleCopyClipboard = async () => {
    if (!currentDiagram) return;

    try {
      await navigator.clipboard.writeText(currentDiagram);
      setExportStatus({ format: 'Clipboard', loading: false, error: null, success: true });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      setExportStatus({ format: 'Clipboard', loading: false, error: 'Copy failed', success: false });
      setTimeout(() => {
        setExportStatus({ format: null, loading: false, error: null, success: false });
      }, 3000);
    }
  };

  const handleReloadDiagram = () => {
    const temp = currentDiagram;
    setDiagram(null);
    setTimeout(() => setDiagram(temp), 10);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const isInputValid = inputValue.trim().length >= 10;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="border-b border-indigo-100 bg-gradient-to-r from-white via-indigo-50/30 to-white">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold" style={{ letterSpacing: '-0.05em' }}>AD</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                  AI Diagram Generator
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">

          {/* Left Panel: Chat Interface */}
          <div className="flex flex-col border border-indigo-100 rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
                  <p className="text-xs text-indigo-600">Describe your diagram</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClearConversation}
                  disabled={isGenerating}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Start a conversation</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Describe what you want to create. You can attach files for additional context.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.files && message.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.files.map((file, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-1.5 text-xs ${
                                  message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                                }`}
                              >
                                <File className="w-3 h-3" strokeWidth={1.5} />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p
                          className={`text-xs mt-1.5 ${
                            message.role === 'user' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-gray-600 animate-spin" strokeWidth={1.5} />
                          <span className="text-sm text-gray-600">Generating diagram...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {error && !isGenerating && (
                    <div className="flex justify-center">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-[85%]">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm font-medium text-red-900">Generation failed</p>
                            <p className="text-xs text-red-700 mt-0.5">{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-gray-50">
              {/* File Upload Area (Collapsible) */}
              {showFileUpload && (
                <div className="px-5 py-3 border-b border-gray-200 bg-white">
                  <div className="space-y-3">
                    {/* Drop zone */}
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <p className="text-xs text-gray-600">
                          {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
                        </p>
                      </div>
                    </div>

                    {/* File error */}
                    {fileError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {fileError}
                      </div>
                    )}

                    {/* Uploaded files */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <File className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                            <span className="flex-1 text-xs text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                            <button
                              onClick={() => removeFile(idx)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <X className="w-3 h-3 text-gray-500" strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attach files button */}
              <div className="px-5 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{showFileUpload ? 'Hide files' : 'Attach files'}</span>
                    {files.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded shadow-sm">
                        {files.length}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-gray-400">Optional context files</span>
                </div>
              </div>

              {/* Message Input */}
              <div className="px-5 py-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isGenerating}
                      placeholder="Describe your diagram..."
                      rows={3}
                      className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <button
                    onClick={() => void handleSendMessage()}
                    disabled={!isInputValid || isGenerating}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all flex items-center gap-2 font-medium text-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>Generate</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">Press Enter to send, Shift + Enter for new line</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Model:</span>
                    <span className="text-xs font-medium text-gray-600">GPT-4o</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Diagram Preview */}
          <div className="flex flex-col border border-indigo-100 rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Diagram Header with Export Options */}
            <div className="px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                    <Layout className="w-4 h-4 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Diagram Preview</h2>
                    <p className="text-xs text-indigo-600">Live preview of your diagram</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const temp = currentDiagram;
                    setDiagram(null);
                    setTimeout(() => setDiagram(temp), 10);
                  }}
                  disabled={!currentDiagram}
                  className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Maximize2 className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                </button>
              </div>

              {/* Export Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-600 mr-2">Export:</span>

                {/* Export Status Messages */}
                {exportStatus.loading && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" strokeWidth={1.5} />
                    <span className="text-xs text-blue-700">Exporting {exportStatus.format}...</span>
                  </div>
                )}
                {exportStatus.success && !exportStatus.loading && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-xs text-green-700">{exportStatus.format} exported!</span>
                  </div>
                )}
                {exportStatus.error && !exportStatus.loading && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-xs text-red-700">{exportStatus.error}</span>
                  </div>
                )}

                {!exportStatus.loading && !exportStatus.success && !exportStatus.error && (
                  <>
                    <button
                      onClick={() => void handleExportPDF()}
                      disabled={!currentDiagram || exportStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => void handleExportPPTX()}
                      disabled={!currentDiagram || exportStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Presentation className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>PPTX</span>
                    </button>
                    <button
                      onClick={() => void handleExportPNG()}
                      disabled={!currentDiagram || exportStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>PNG</span>
                    </button>
                    <button
                      onClick={() => void handleExportHTML()}
                      disabled={!currentDiagram || exportStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Code className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>HTML</span>
                    </button>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => void handleCopyClipboard()}
                      disabled={!currentDiagram || exportStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleReloadDiagram}
                      disabled={!currentDiagram}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Diagram Canvas */}
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
              {!currentDiagram && !isGenerating && !error ? (
                // Empty state
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3">
                    <Layout className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No diagram yet</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Your diagram will appear here once generated
                  </p>
                </div>
              ) : isGenerating ? (
                // Loading state
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="w-10 h-10 text-gray-600 animate-spin mb-3" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Generating diagram...</h3>
                  <p className="text-xs text-gray-500">This may take a few moments</p>
                </div>
              ) : error && !currentDiagram ? (
                // Error state
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                    <FileX className="w-6 h-6 text-red-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Generation failed</h3>
                  <p className="text-xs text-red-700 max-w-xs">{error}</p>
                </div>
              ) : (
                // Diagram preview
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                  <iframe
                    srcDoc={currentDiagram || undefined}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0"
                    title="Diagram preview"
                  />
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="px-5 py-3 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${currentDiagram ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm' : 'bg-gray-300'}`}></div>
                    <span className={`${currentDiagram ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>{currentDiagram ? 'Ready' : 'Waiting'}</span>
                  </div>
                  {metadata?.generationTime && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">Generated in {metadata.generationTime}s</span>
                    </>
                  )}
                </div>
                {metadata && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Model:</span>
                    <span className="font-medium text-gray-600">{metadata.model}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{metadata.tokensUsed} tokens</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
