'use client';

/**
 * FileUpload Component
 *
 * Drag-and-drop file upload with validation and preview.
 * Features:
 * - Multi-file selection (max 10 files)
 * - Drag-and-drop zone
 * - File validation (type, size, total size)
 * - File preview with remove buttons
 * - Supported formats: txt, images, PDF, DOCX, PPTX, XLSX, CSV
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import type { FileUploadProps } from '@/types/diagram';
import { ACCEPTED_FILE_TYPES, FILE_VALIDATION } from '@/types/diagram';

export function FileUpload({
  files,
  onFilesChange,
  onFilesRemove,
  maxFiles = FILE_VALIDATION.MAX_FILES,
  maxFileSize = FILE_VALIDATION.MAX_FILE_SIZE,
  maxTotalSize = FILE_VALIDATION.MAX_TOTAL_SIZE,
  disabled = false,
  error,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check total file count
      if (files.length + acceptedFiles.length > maxFiles) {
        return;
      }

      // Check individual file sizes
      const validFiles = acceptedFiles.filter(
        (file) => file.size <= maxFileSize
      );

      // Check total size
      const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);
      const newTotalSize = validFiles.reduce(
        (sum, file) => sum + file.size,
        currentTotalSize
      );

      if (newTotalSize > maxTotalSize) {
        return;
      }

      onFilesChange([...files, ...validFiles]);
    },
    [files, onFilesChange, maxFiles, maxFileSize, maxTotalSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    disabled,
    maxFiles,
    maxSize: maxFileSize,
  });

  const removeFile = (index: number) => {
    onFilesRemove([index]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon size={16} strokeWidth={1.5} />;
    }
    if (file.type === 'application/pdf') {
      return <FileText size={16} strokeWidth={1.5} />;
    }
    return <File size={16} strokeWidth={1.5} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizePercentage = (totalSize / maxTotalSize) * 100;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <Upload
              size={20}
              strokeWidth={1.5}
              className={isDragActive ? 'text-blue-600' : 'text-gray-600'}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: Images, PDF, DOCX, PPTX, XLSX, CSV, TXT
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Max {maxFiles} files</span>
            <span>•</span>
            <span>Max {formatFileSize(maxFileSize)} per file</span>
            <span>•</span>
            <span>Max {formatFileSize(maxTotalSize)} total</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Uploaded Files ({files.length}/{maxFiles})
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
            </p>
          </div>

          {/* Total Size Progress Bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalSizePercentage > 90
                  ? 'bg-red-500'
                  : totalSizePercentage > 70
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(totalSizePercentage, 100)}%` }}
            />
          </div>

          {/* File Cards */}
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                  {getFileIcon(file)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                    {file.type && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="uppercase">
                          {file.type.split('/')[1]?.split('.')?.pop() || 'file'}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>

          {/* Clear All Button */}
          {files.length > 1 && (
            <button
              onClick={() =>
                onFilesRemove(files.map((_, index) => index))
              }
              disabled={disabled}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
