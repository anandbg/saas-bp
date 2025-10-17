'use client';

/**
 * AI Diagram Generator - Main Application Page
 *
 * Integrates all components into a cohesive diagram generation experience:
 * - ChatInterface for conversational diagram requests
 * - FileUpload for providing context via files
 * - DiagramPreview for viewing generated diagrams
 * - ExportPanel for exporting diagrams in multiple formats
 *
 * Uses state management hooks:
 * - useConversation: Manages message history with sessionStorage persistence
 * - useDiagramGeneration: Handles diagram generation with retry logic and caching
 */

import { useState } from 'react';
import {
  ChatInterface,
  FileUpload,
  DiagramPreview,
  ExportPanel,
} from '@/components/diagram';
import { useConversation } from '@/hooks/useConversation';
import { useDiagramGeneration } from '@/hooks/useDiagramGeneration';

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

  /**
   * Handle sending a message and generating a diagram
   */
  const handleSendMessage = async (userMessage: string) => {
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
      enableValidation: true,
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
  };

  /**
   * Handle file changes
   */
  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setFileError(undefined);
  };

  /**
   * Handle file removal
   */
  const handleFilesRemove = (indexes: number[]) => {
    setFiles((prev) => prev.filter((_, i) => !indexes.includes(i)));
  };

  /**
   * Export to PowerPoint (PPTX)
   */
  const handleExportPPTX = async () => {
    if (!currentDiagram) {
      return;
    }

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentDiagram,
          format: 'pptx',
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PPTX export failed:', err);
    }
  };

  /**
   * Export to PDF
   */
  const handleExportPDF = async () => {
    if (!currentDiagram) {
      return;
    }

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentDiagram,
          format: 'pdf',
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  /**
   * Export to PNG
   */
  const handleExportPNG = async () => {
    if (!currentDiagram) {
      return;
    }

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentDiagram,
          format: 'png',
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  /**
   * Download HTML file (standalone with CDN dependencies)
   */
  const handleExportHTML = async () => {
    if (!currentDiagram) {
      return;
    }

    try {
      const response = await fetch('/api/diagram/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentDiagram,
          format: 'html',
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('HTML export failed:', err);
    }
  };

  /**
   * Copy HTML to clipboard
   */
  const handleCopyClipboard = async () => {
    if (!currentDiagram) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentDiagram);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  /**
   * Reload current diagram
   */
  const handleReloadDiagram = () => {
    // Force re-render by setting to null then back
    const temp = currentDiagram;
    setDiagram(null);
    setTimeout(() => setDiagram(temp), 10);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                AI Diagram Generator
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create professional diagrams with AI assistance
              </p>
            </div>

            {/* Optional: Add navigation or user menu here */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Column: Chat + File Upload */}
          <div className="flex flex-col gap-6 h-full">
            {/* Chat Interface */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-6 overflow-hidden">
              <ChatInterface
                messages={messages}
                onSendMessage={(message) => { void handleSendMessage(message); }}
                onClearConversation={handleClearConversation}
                isLoading={isGenerating}
                error={error}
              />
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold tracking-tight text-gray-900 mb-4">
                Upload Context Files (Optional)
              </h3>
              <FileUpload
                files={files}
                onFilesChange={handleFilesChange}
                onFilesRemove={handleFilesRemove}
                disabled={isGenerating}
                error={fileError}
              />
            </div>
          </div>

          {/* Right Column: Preview + Export */}
          <div className="flex flex-col gap-6 h-full">
            {/* Diagram Preview */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-6 overflow-hidden">
              <DiagramPreview
                html={currentDiagram}
                isLoading={isGenerating}
                error={error}
                onReload={handleReloadDiagram}
                onFullScreen={() => {}}
                onDownload={handleExportHTML}
              />
            </div>

            {/* Export Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ExportPanel
                html={currentDiagram}
                onExportPPTX={async () => { await handleExportPPTX(); }}
                onExportPDF={async () => { await handleExportPDF(); }}
                onExportPNG={async () => { await handleExportPNG(); }}
                onExportHTML={async () => { await handleExportHTML(); }}
                onCopyClipboard={async () => { await handleCopyClipboard(); }}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
