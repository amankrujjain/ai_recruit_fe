import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const acceptByType = {
  excel: '.xlsx,.xls',
  resume: '.pdf,.docx,.zip',
};

export function FileUploadZone({ type, onUpload, uploading, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file && onUpload) onUpload(file);
  };

  const label = type === 'excel'
    ? 'Upload Excel spreadsheet (.xlsx)'
    : 'Upload resume PDF, DOCX, or ZIP';

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        dragOver ? 'border-brand-500 bg-brand-50' : 'border-border bg-card',
        disabled && 'pointer-events-none opacity-50'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="mx-auto mb-3 h-8 w-8 text-brand-600" />
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted">Drag and drop or choose a file</p>
      <input
        ref={inputRef}
        type="file"
        accept={acceptByType[type]}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Choose file'}
      </Button>
    </div>
  );
}
