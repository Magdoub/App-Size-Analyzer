/**
 * File Validator Component
 *
 * Validates uploaded files and displays validation results
 */

import { useEffect, useState } from 'react';
import type { Platform } from '../../types/analysis';

export interface ValidationResult {
  valid: boolean;
  platform?: Platform;
  error?: string;
  warnings: string[];
  fileSize: number;
  fileName: string;
}

export interface FileValidatorProps {
  file: File;
  onValidated: (result: ValidationResult) => void;
  maxSizeMB?: number;
}

export function FileValidator({ file, onValidated, maxSizeMB = 2000 }: FileValidatorProps) {
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateFile = (): ValidationResult => {
    const warnings: string[] = [];

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum of ${maxSizeMB}MB`,
        warnings,
        fileSize: file.size,
        fileName: file.name,
      };
    }

    // Check file extension and determine platform
    const extension = file.name.toLowerCase().split('.').pop();
    let platform: Platform | undefined;

    if (extension === 'ipa') {
      platform = 'iOS';
    } else if (extension === 'apk' || extension === 'aab' || extension === 'xapk') {
      platform = 'Android';
    } else if (extension === 'zip') {
      // Could be xcarchive or apks
      if (file.name.toLowerCase().includes('xcarchive')) {
        platform = 'iOS';
      } else if (file.name.toLowerCase().includes('apks')) {
        platform = 'Android';
      } else {
        return {
          valid: false,
          error: 'ZIP file must be an xcarchive (iOS) or apks (Android)',
          warnings,
          fileSize: file.size,
          fileName: file.name,
        };
      }
    } else {
      return {
        valid: false,
        error: `Unsupported file format: .${extension}. Expected: .ipa, .apk, .aab, .xcarchive.zip`,
        warnings,
        fileSize: file.size,
        fileName: file.name,
      };
    }

    // Add warnings for large files
    if (fileSizeMB > 500) {
      warnings.push(
        `Large file (${fileSizeMB.toFixed(1)}MB) - parsing may take longer than usual`
      );
    }

    return {
      valid: true,
      platform,
      warnings,
      fileSize: file.size,
      fileName: file.name,
    };
  };

  // Run validation only when file changes (useEffect prevents infinite loop)
  useEffect(() => {
    const validationResult = validateFile();
    setResult(validationResult);
    onValidated(validationResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]); // Only re-run when file changes

  // Don't render until we have a result
  if (!result) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      {result.valid ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">File validated successfully</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Platform: {result.platform}</p>
                <p>Size: {(result.fileSize / (1024 * 1024)).toFixed(2)}MB</p>
              </div>
              {result.warnings.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">Warnings:</p>
                  <ul className="list-disc list-inside">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation failed</h3>
              <p className="mt-2 text-sm text-red-700">{result.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
