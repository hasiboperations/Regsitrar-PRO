import React, { useState, useCallback } from 'react';
import DocumentIcon from './icons/DocumentIcon';
import ImageIcon from './icons/ImageIcon'; // Generic image icon

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  title?: string;
  buttonText?: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, title = "Drag & drop your file here", buttonText = "Browse File", accept = ".docx" }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  const isImageUpload = accept.startsWith('image/');

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
        isDragging ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-gray-300 bg-white hover:border-indigo-600 hover:shadow-xl'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={accept}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        {isImageUpload ? <ImageIcon className="w-16 h-16 text-gray-400 mb-4" /> : <DocumentIcon className="w-16 h-16 text-gray-400 mb-4" />}
        <p className="text-xl font-semibold text-gray-700 text-center">
          {title}
        </p>
        <p className="text-gray-500 mt-2">or</p>
        <span className="mt-2 inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          {buttonText}
        </span>
      </label>
    </div>
  );
};

export default FileUpload;
