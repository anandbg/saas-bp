/**
 * useConversation Hook
 *
 * Manages conversation message history with sessionStorage persistence.
 * - Auto-restore conversation on page reload
 * - Type-safe message management
 * - Graceful error handling for storage quota exceeded
 *
 * @example
 * ```tsx
 * const { messages, addMessage, clearConversation } = useConversation();
 *
 * addMessage({
 *   role: 'user',
 *   content: 'Create a flowchart',
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/types/diagram';

const STORAGE_KEY = 'ai-diagram-conversation';
const STORAGE_VERSION = '1.0';

interface StoredConversation {
  version: string;
  messages: Message[];
  timestamp: number;
}

/**
 * Safely parse JSON from sessionStorage
 */
function safelyParseStorage(key: string): StoredConversation | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredConversation;

    // Validate version
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[useConversation] Storage version mismatch, clearing old data');
      sessionStorage.removeItem(key);
      return null;
    }

    // Convert timestamp strings back to Date objects
    const messages = parsed.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    return { ...parsed, messages };
  } catch (error) {
    console.error('[useConversation] Failed to parse conversation from storage:', error);
    // Clear corrupted data
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors during cleanup
    }
    return null;
  }
}

/**
 * Safely save conversation to sessionStorage
 */
function safelySaveToStorage(key: string, messages: Message[]): boolean {
  try {
    const data: StoredConversation = {
      version: STORAGE_VERSION,
      messages,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    // Check if it's a quota exceeded error
    if (
      error instanceof Error &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.error('[useConversation] SessionStorage quota exceeded, cannot save conversation');

      // Try to clear old data and retry once
      try {
        sessionStorage.clear();
        sessionStorage.setItem(key, JSON.stringify({
          version: STORAGE_VERSION,
          messages,
          timestamp: Date.now(),
        }));
        console.log('[useConversation] Successfully saved after clearing storage');
        return true;
      } catch {
        console.error('[useConversation] Failed to save even after clearing storage');
      }
    } else {
      console.error('[useConversation] Failed to save conversation to storage:', error);
    }
    return false;
  }
}

export interface UseConversationResult {
  /** Current message history */
  messages: Message[];

  /** Add a new message to the conversation */
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;

  /** Clear all messages from the conversation */
  clearConversation: () => void;

  /** Manually load conversation from storage (called automatically on mount) */
  loadConversation: () => void;

  /** Whether storage operations are working */
  storageAvailable: boolean;
}

/**
 * Hook for managing conversation state with persistence
 */
export function useConversation(): UseConversationResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);

  /**
   * Load conversation from sessionStorage on mount
   */
  const loadConversation = useCallback(() => {
    const stored = safelyParseStorage(STORAGE_KEY);
    if (stored) {
      setMessages(stored.messages);
      console.log(`[useConversation] Restored ${stored.messages.length} messages from storage`);
    }
  }, []);

  /**
   * Initialize conversation from storage on mount
   */
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /**
   * Save to storage whenever messages change
   */
  useEffect(() => {
    if (messages.length > 0) {
      const success = safelySaveToStorage(STORAGE_KEY, messages);
      setStorageAvailable(success);
    }
  }, [messages]);

  /**
   * Add a new message to the conversation
   */
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${message.role}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  }, []);

  /**
   * Clear all messages and storage
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setStorageAvailable(true);
    } catch (error) {
      console.error('[useConversation] Failed to clear storage:', error);
    }
  }, []);

  return {
    messages,
    addMessage,
    clearConversation,
    loadConversation,
    storageAvailable,
  };
}
