'use client';

/**
 * DiagramPreview Component
 *
 * Sandboxed iframe preview for generated HTML diagrams.
 * Features:
 * - Sandboxed iframe rendering (security)
 * - Zoom controls (in/out/reset)
 * - Full-screen mode
 * - Loading states and error handling
 * - Empty state with helpful message
 */

import { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  FileX,
  Loader2,
} from 'lucide-react';
import type { DiagramPreviewProps } from '@/types/diagram';

export function DiagramPreview({
  html,
  isLoading,
  error,
  onReload,
  onFullScreen,
  onDownload,
}: DiagramPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when new HTML is loaded
  useEffect(() => {
    if (html) {
      setZoom(100);
    }
  }, [html]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const handleFullScreen = async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        onFullScreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    onReload?.();
  };

  // Empty State
  if (!html && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-2">
          No diagram yet
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Upload files and describe what you want to create. Your diagram will
          appear here once generated.
        </p>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-2">
          Generating diagram...
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          This may take a few moments. We're creating your diagram with AI.
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center border border-red-200 rounded-lg bg-red-50">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <FileX className="w-8 h-8 text-red-600" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-red-900 mb-2">
          Generation failed
        </h3>
        <p className="text-sm text-red-700 max-w-md mb-4">{error}</p>
        {onReload && (
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={16} strokeWidth={1.5} />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Preview with iframe
  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full ${
        isFullScreen ? 'bg-white' : 'border border-gray-200 rounded-lg'
      }`}
    >
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} strokeWidth={1.5} />
          </button>

          <button
            onClick={handleZoomReset}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors min-w-[60px]"
            aria-label="Reset zoom"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Reload */}
          {onReload && (
            <button
              onClick={handleReload}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              aria-label="Reload diagram"
            >
              <RefreshCw size={16} strokeWidth={1.5} />
            </button>
          )}

          {/* Download */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              aria-label="Download diagram"
            >
              <Download size={16} strokeWidth={1.5} />
            </button>
          )}

          {/* Full Screen */}
          <button
            onClick={handleFullScreen}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullScreen ? (
              <Minimize2 size={16} strokeWidth={1.5} />
            ) : (
              <Maximize2 size={16} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Iframe Preview */}
      <div className="flex-1 overflow-auto bg-white p-4">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${(100 / zoom) * 100}%`,
            height: `${(100 / zoom) * 100}%`,
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html || undefined}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 min-h-[500px]"
            title="Diagram preview"
          />
        </div>
      </div>
    </div>
  );
}
