import { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface ImagePasteInputProps {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  width?: number;
  height?: number;
  required?: boolean;
}

export default function ImagePasteInput({
  label,
  value,
  onChange,
  width,
  height,
  required = false,
}: ImagePasteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isFocused) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width || img.width;
                canvas.height = height || img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  onChange(canvas.toDataURL('image/png'));
                }
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(blob);
          }
          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isFocused, onChange, width, height]);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-[#2C2C2C] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
        {width && height && (
          <span className="text-[#999999] ml-2">({width}x{height})</span>
        )}
      </label>
      <div
        ref={containerRef}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
          isFocused
            ? 'border-[#2b77f5] bg-[#E8F0FF]'
            : value
            ? 'border-[#E0E0E0] bg-white'
            : 'border-[#E0E0E0] hover:border-[#2b77f5] hover:bg-[#F9FCFF] bg-white'
        }`}
        onClick={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="max-w-full h-auto mx-auto" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="w-8 h-8 text-[#999999] mx-auto mb-2" />
            <p className="text-[#666666]">
              붙여넣기
            </p>
          </div>
        )}
      </div>
    </div>
  );
}