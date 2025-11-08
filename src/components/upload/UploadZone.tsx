/**
 * Upload Zone Component
 *
 * Drag-and-drop file upload zone for IPA/APK files
 */

import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  maxSizeMB?: number;
}

export function UploadZone({ onFileSelect, acceptedFormats, maxSizeMB = 2000 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center
          transition-colors duration-200 cursor-pointer
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            {/* Upload Icon */}
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            {/* Text */}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragging ? 'Drop your file here' : 'Drag and drop your app file'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                or <span className="text-blue-600 hover:text-blue-700">browse</span> to choose
              </p>
            </div>

            {/* Accepted formats */}
            <div className="mt-2 text-xs text-gray-500">
              <p>Supported formats: {acceptedFormats.join(', ')}</p>
              <p className="mt-1">Maximum size: {maxSizeMB}MB</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
