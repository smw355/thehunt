'use client';

import React, { useState } from 'react';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { compressImage, createImagePreview, validateFile, uploadFile, formatFileSize } from '../utils/imageUtils';

export default function PhotoUpload({ teamId, clueId, onPhotosChange, disabled = false, requiredPhotos = 0, clueTitle = '' }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setError('');
    setUploading(true);

    try {
      for (const file of files) {
        // Validate file
        const validationErrors = validateFile(file);
        if (validationErrors.length > 0) {
          setError(validationErrors[0]);
          continue;
        }

        // Compress image if it's an image
        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }

        // Create preview
        const preview = await createImagePreview(processedFile);

        // Upload file
        const uploadResult = await uploadFile(processedFile, teamId, clueId);

        const newFile = {
          id: uploadResult.fileId,
          url: uploadResult.url,
          preview: preview,
          originalName: uploadResult.originalName,
          size: uploadResult.size,
          type: uploadResult.type
        };

        setUploadedFiles(prev => {
          const updated = [...prev, newFile];
          onPhotosChange(updated);
          return updated;
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Clear the input so same file can be uploaded again
      event.target.value = '';
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      onPhotosChange(updated);
      return updated;
    });
  };

  const isMobile = typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);

  return (
    <div className="mb-4">
      <label className="block font-bold mb-2">
        Photo/Video Proof:
        {requiredPhotos > 0 && (
          <span className="ml-2 text-sm font-normal text-red-600">
            ({uploadedFiles.length}/{requiredPhotos} required photos)
          </span>
        )}
      </label>

      {/* Photo Requirements Info */}
      {requiredPhotos > 0 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            📸 <strong>This challenge requires exactly {requiredPhotos} photo{requiredPhotos > 1 ? 's' : ''}.</strong>
            {clueTitle && ` For "${clueTitle}"`}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            You can take new photos or select existing ones from your gallery.
          </p>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="space-y-2">
        {/* Take Photo Button (Mobile) */}
        {isMobile && (
          <>
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment" // Use back camera on mobile
              multiple
              className="hidden"
              id="photo-capture"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
            />
            <label
              htmlFor="photo-capture"
              className={`w-full py-2 sm:py-3 rounded-lg text-base sm:text-lg font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer transition-colors ${
                disabled || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {uploading ? (
                <LoadingSpinner size="small" message="Uploading..." />
              ) : (
                <>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Take Photo / Record Video</span><span className="sm:hidden">Take Photo</span>
                </>
              )}
            </label>
          </>
        )}

        {/* Select from Gallery Button */}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          id="photo-upload"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        <label
          htmlFor="photo-upload"
          className={`w-full py-2 sm:py-3 rounded-lg text-base sm:text-lg font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer transition-colors ${
            disabled || uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : isMobile ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {uploading ? (
            <LoadingSpinner size="small" message="Uploading..." />
          ) : (
            <>
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{isMobile ? 'Select from Gallery' : 'Upload Photo / Video'}</span><span className="sm:hidden">{isMobile ? 'Gallery' : 'Upload'}</span>
            </>
          )}
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mt-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* File Preview Grid */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="relative group">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.preview}
                    alt="Upload preview"
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                    <Upload className="w-8 h-8 text-gray-500" />
                    <span className="ml-2 text-sm text-gray-600">Video</span>
                  </div>
                )}

                {/* File Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                  <div className="truncate">{file.originalName}</div>
                  <div>{formatFileSize(file.size)}</div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tips for Mobile */}
      {isMobile && (
        <div className="text-sm text-gray-600 mt-2">
          💡 <strong>Blue button:</strong> Opens camera to take new photos<br />
          💡 <strong>Green button:</strong> Select existing photos from your gallery
        </div>
      )}

      {/* Requirements Status */}
      {requiredPhotos > 0 && uploadedFiles.length > 0 && (
        <div className={`text-sm mt-2 p-2 rounded ${
          uploadedFiles.length === requiredPhotos
            ? 'bg-green-100 text-green-700 border border-green-200'
            : uploadedFiles.length > requiredPhotos
            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {uploadedFiles.length === requiredPhotos
            ? '✅ Perfect! You have the required number of photos.'
            : uploadedFiles.length > requiredPhotos
            ? `⚠️ You have ${uploadedFiles.length - requiredPhotos} extra photo${uploadedFiles.length - requiredPhotos > 1 ? 's' : ''}. Consider removing some.`
            : `📸 You need ${requiredPhotos - uploadedFiles.length} more photo${requiredPhotos - uploadedFiles.length > 1 ? 's' : ''}.`
          }
        </div>
      )}
    </div>
  );
}