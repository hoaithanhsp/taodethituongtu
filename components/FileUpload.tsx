import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelect: (fileData: FileData) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, PNG).");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Vui lòng chọn file dưới 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = (e.target?.result as string).split(',')[1];
      onFileSelect({
        base64: base64String,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          {isLoading ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-slate-700">Đang phân tích đề mẫu...</p>
              <p className="text-sm text-slate-500 mt-2">Quá trình này có thể mất 30-60 giây</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-100 rounded-full mb-4 text-blue-600">
                <Upload className="w-8 h-8" />
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-700">
                Kéo thả đề thi vào đây
              </p>
              <p className="mb-4 text-sm text-slate-500">
                hoặc <span className="font-semibold text-blue-600 hover:text-blue-700">chọn file từ máy tính</span>
              </p>
              <p className="text-xs text-slate-400">
                Hỗ trợ PDF, JPG, PNG (Max 10MB)
              </p>
            </>
          )}
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          className="absolute w-full h-full opacity-0 cursor-pointer" 
          onChange={handleChange}
          disabled={isLoading}
          accept=".pdf, .jpg, .jpeg, .png"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};