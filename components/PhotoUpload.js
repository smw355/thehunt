'use client';

import React, { useState } from 'react';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { compressImage, createImagePreview, validateFile, uploadFile, formatFileSize } from '../utils/imageUtils';

export default function PhotoUpload({ teamId, clueId, onPhotosChange, disabled = false }) {
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
      <label className="block font-bold mb-2">Photo/Video Proof:</label>

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*,video/*"
          capture={isMobile ? 'environment' : undefined} // Use back camera on mobile
          multiple
          className="hidden"
          id="photo-upload"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />

        <label
          htmlFor="photo-upload"
          className={`w-full py-4 rounded-lg text-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            disabled || uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {uploading ? (
            <LoadingSpinner size="small" message="Uploading..." />
          ) : (
            <>
              <Camera className="w-6 h-6" />
              {isMobile ? 'Take Photo / Record Video' : 'Upload Photo / Video'}
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
          💡 Tip: The camera will open automatically. Take clear photos showing your completed challenge!
        </div>
      )}
    </div>
  );
}