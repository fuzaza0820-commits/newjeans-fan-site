import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageLoaded: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onImageLoaded(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`drop-zone flex flex-col items-center justify-center w-full h-full rounded-2xl cursor-pointer transition-all duration-300 ${
        isDragOver ? 'drag-over scale-[1.02]' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {/* 上传图标 */}
      <svg className="w-16 h-16 mb-4 text-indigo-400 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-lg font-medium text-slate-300 mb-1">点击上传或拖拽图片到这里</p>
      <p className="text-sm text-slate-500">支持 PNG、JPG、WebP · 最大 20MB</p>
    </div>
  );
};
