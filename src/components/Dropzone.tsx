import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertTriangle, HelpCircle } from "lucide-react";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function Dropzone({ onFilesSelected, disabled = false }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    const maxFiles = 20;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Only image files (PNG, JPEG, WEBP) are supported.");
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > maxFiles) {
      setErrorMsg(`Bulk staging supports up to 20 images at once. Please select fewer images.`);
      return;
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const triggerFileInput = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer text-center transition-all duration-200 select-none ${
          disabled
            ? "border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed"
            : isDragActive
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
          disabled={disabled}
        />

        {/* Visual elements */}
        <div className={`p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4 transition-transform duration-200 ${isDragActive ? "scale-110 text-blue-400" : "text-slate-400"}`}>
          <UploadCloud className="h-10 w-10" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-100">
          Drag and drop your images here
        </h3>
        
        <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-3">
          Supports PNG, JPEG, WEBP — up to <span className="font-semibold text-blue-400">20 images</span> at once
        </p>

        <button
          type="button"
          disabled={disabled}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-blue-950/30"
        >
          Select Images
        </button>

        {/* Helper Note inside uploader */}
        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 bg-slate-950/20 px-3 py-1 rounded-full border border-slate-800/50">
          <HelpCircle className="h-3 w-3 text-blue-400/80" />
          <span>Local processing: your photos never leave your device.</span>
        </div>
      </div>

      {/* Error prompt */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-rose-400 animate-slide-up">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Selection Error</p>
            <p className="text-xs text-rose-400/90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
