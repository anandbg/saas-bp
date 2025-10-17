'use client';

/**
 * AI Diagram Generator - Main Application Page
 *
 * Integrates all components into a cohesive diagram generation experience:
 * - ChatInterface for conversational diagram requests
 * - FileUpload for providing context via files
 * - DiagramPreview for viewing generated diagrams
 * - ExportPanel for exporting diagrams in multiple formats
 */

import { useState } from 'react';
import {
  ChatInterface,
  FileUpload,
  DiagramPreview,
  ExportPanel,
} from '@/components/diagram';
import type { Message, GenerateResponse } from '@/types/diagram';

export default function Home() {
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();

  // Diagram state
  const [currentDiagram, setCurrentDiagram] = useState<string | null>(null);

  /**
   * Handle sending a message and generating a diagram
   */
  const handleSendMessage = async (userMessage: string) => {
    // Add user message to conversation
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      files: files.length > 0 ? files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })) : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setError(undefined);
    setIsGenerating(true);

    try {
      // Build FormData for API request
      const formData = new FormData();
      formData.append('userRequest', userMessage);
      formData.append('enableValidation', 'true');
      formData.append('maxIterations', '5');

      // Append files if any
      files.forEach((file) => {
        formData.append('file', file);
      });

      // Include conversation history (previous messages only, not current)
      if (messages.length > 0) {
        formData.append('conversationHistory', JSON.stringify(messages));
      }

      // Call API
      const response = await fetch('/api/diagram/generate', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as GenerateResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate diagram');
      }

      // Add assistant response to conversation
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: 'Generated diagram successfully!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update current diagram
      if (result.html) {
        setCurrentDiagram(result.html);
      }

      // Clear files after successful generation
      setFiles([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      // Add error message to conversation
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle clearing the conversation
   */
  const handleClearConversation = () => {
    setMessages([]);
    setCurrentDiagram(null);
    setFiles([]);
    setError(undefined);
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
   * Download HTML file
   */
  const handleExportHTML = () => {
    if (!currentDiagram) {
      return;
    }

    const blob = new Blob([currentDiagram], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
    setCurrentDiagram(null);
    setTimeout(() => setCurrentDiagram(temp), 10);
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
                onSendMessage={handleSendMessage}
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
                onExportPPTX={handleExportPPTX}
                onExportPDF={handleExportPDF}
                onExportPNG={handleExportPNG}
                onExportHTML={handleExportHTML}
                onCopyClipboard={handleCopyClipboard}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
