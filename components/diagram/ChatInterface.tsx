'use client';

/**
 * ChatInterface Component
 *
 * Main conversational interface for diagram generation.
 * Features:
 * - Message history display (user + assistant messages)
 * - Multiline text input with keyboard shortcuts
 * - Loading states and error handling
 * - Auto-scroll to latest message
 * - Clear conversation functionality
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Trash2, AlertCircle } from 'lucide-react';
import type { ChatInterfaceProps } from '@/types/diagram';

export function ChatInterface({
  messages,
  onSendMessage,
  onClearConversation,
  isLoading,
  error,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue.length < 10) {
      return; // Minimum 10 characters required
    }

    onSendMessage(trimmedValue);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return date.toLocaleDateString();
  };

  const isInputValid = inputValue.trim().length >= 10;
  const characterCount = inputValue.length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            AI Diagram Generator
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Describe your diagram or upload files to get started
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearConversation}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} strokeWidth={1.5} />
            Clear
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-2">
              Start a new diagram
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Describe what you want to create, or upload files like PDFs, images,
              or documents to provide context.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-900 mb-1">Example:</p>
                <p className="text-xs text-gray-600">
                  &quot;Create a system architecture diagram with 5 microservices&quot;
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-900 mb-1">Example:</p>
                <p className="text-xs text-gray-600">
                  &quot;Design a flowchart for user authentication&quot;
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Message history
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } rounded-2xl px-4 py-3`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                      {/* File attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.files.map((file, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 text-xs ${
                                message.role === 'user'
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span>{file.name}</span>
                              <span>({Math.round(file.size / 1024)}KB)</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-blue-200'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      Generating diagram...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex justify-center">
                <div className="max-w-[80%] bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">
                        Generation failed
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 pt-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Describe your diagram... (min. 10 characters)"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-28 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '200px' }}
          />

          {/* Character count and send button */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span
              className={`text-xs ${
                isInputValid
                  ? 'text-gray-500'
                  : characterCount > 0
                  ? 'text-amber-600'
                  : 'text-gray-400'
              }`}
            >
              {characterCount}/10
            </span>

            <button
              onClick={handleSubmit}
              disabled={!isInputValid || isLoading}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to send,
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
