'use client';

/**
 * ExportPanel Component
 *
 * Multi-format export controls for generated diagrams.
 * Features:
 * - Export to PPTX (PowerPoint)
 * - Export to PDF
 * - Export to PNG (image)
 * - Download HTML file
 * - Copy to clipboard
 * - Loading states and success feedback
 */

import { useState } from 'react';
import {
  FileText,
  FileImage,
  Download,
  Clipboard,
  Check,
  Loader2,
  Presentation,
  LucideIcon,
} from 'lucide-react';
import type { ExportPanelProps } from '@/types/diagram';

type ExportType = 'pptx' | 'pdf' | 'png' | 'html' | 'clipboard';

export function ExportPanel({
  html,
  onExportPPTX,
  onExportPDF,
  onExportPNG,
  onExportHTML,
  onCopyClipboard,
  disabled = false,
}: ExportPanelProps) {
  const [loadingExport, setLoadingExport] = useState<ExportType | null>(null);
  const [successExport, setSuccessExport] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType, handler: () => void | Promise<void>) => {
    setLoadingExport(type);
    setSuccessExport(null);

    try {
      await handler();
      setSuccessExport(type);

      // Clear success state after 2 seconds
      setTimeout(() => {
        setSuccessExport(null);
      }, 2000);
    } catch (error) {
      console.error(`Export ${type} failed:`, error);
    } finally {
      setLoadingExport(null);
    }
  };

  const isDisabled = disabled || !html;

  interface ExportButton {
    type: ExportType;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    color: string;
  }

  const exportButtons: ExportButton[] = [
    {
      type: 'pptx',
      label: 'Export to PowerPoint',
      icon: Presentation,
      onClick: () => void handleExport('pptx', onExportPPTX),
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      type: 'pdf',
      label: 'Export to PDF',
      icon: FileText,
      onClick: () => void handleExport('pdf', onExportPDF),
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      type: 'png',
      label: 'Export to PNG',
      icon: FileImage,
      onClick: () => void handleExport('png', onExportPNG),
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      type: 'html',
      label: 'Download HTML',
      icon: Download,
      onClick: () => void handleExport('html', onExportHTML),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      type: 'clipboard',
      label: 'Copy to Clipboard',
      icon: Clipboard,
      onClick: () => void handleExport('clipboard', onCopyClipboard),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900">
          Export Diagram
        </h3>
        {html && (
          <span className="text-xs text-gray-500">
            Choose a format below
          </span>
        )}
      </div>

      {/* Export Buttons Grid */}
      <div className="grid grid-cols-1 gap-2">
        {exportButtons.map((button) => {
          const Icon = button.icon;
          const isLoading = loadingExport === button.type;
          const isSuccess = successExport === button.type;

          return (
            <button
              key={button.type}
              onClick={button.onClick}
              disabled={isDisabled || isLoading}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                text-white text-sm font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSuccess ? 'bg-green-600' : button.color}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check size={16} strokeWidth={1.5} />
                  <span>
                    {button.type === 'clipboard' ? 'Copied!' : 'Exported!'}
                  </span>
                </>
              ) : (
                <>
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{button.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      {!html && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Generate a diagram first to enable export options
          </p>
        </div>
      )}

      {html && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Export to PowerPoint for presentations, PDF for
            documents, or PNG for images.
          </p>
        </div>
      )}
    </div>
  );
}
