
import React, { useState, useRef } from 'react';
import { Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { uploadToImgbb, ImgbbResponse } from '../services/imgbbService';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onUploadSuccess: (data: ImgbbResponse) => void;
  label?: string;
  maxSizeMB?: number;
  className?: string;
  previewUrl?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUploadSuccess, 
  label = "Upload Image", 
  maxSizeMB = 5,
  className = "",
  previewUrl: initialPreview
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, GIF)');
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    // Show local preview immediately
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setIsUploading(true);

    try {
      const result = await uploadToImgbb(file);
      onUploadSuccess(result);
      toast.success('Image processed successfully!');
    } catch (error: any) {
      toast.error(error.message);
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayPreview = localPreview || initialPreview;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>}
      
      <div className="flex items-center space-x-4">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all group ${
            isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50'
          }`}
        >
          {displayPreview ? (
            <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-300 group-hover:text-blue-400" />
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-1">Uploading</span>
            </div>
          )}
          
          <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-lg text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <p className="text-[10px] text-gray-400 font-medium">
            Max size: {maxSizeMB}MB • Professional formats only
          </p>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline disabled:opacity-50"
          >
            {displayPreview ? 'Change Photo' : 'Select Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
