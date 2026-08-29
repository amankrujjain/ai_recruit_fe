import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const acceptByType = {
  excel: '.xlsx,.xls',
  resume: '.pdf,.docx,.zip',
};

const MAX_FILES = 100;

export function FileUploadZone({ type, onUpload, uploading, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX_FILES);
    if (!files.length || !onUpload) return;
    if (type === 'excel') {
      onUpload(files[0]);
      return;
    }
    onUpload(files.length === 1 ? files[0] : files);
  };

  const isResume = type !== 'excel';
  const title = isResume ? 'Drop CVs here or browse files' : 'Upload Excel spreadsheet (.xlsx)';
  const hint = isResume
    ? 'PDF, DOCX, or ZIP — up to 100 files at once'
    : 'Drag and drop or choose a file';

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
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
      <Upload className="mx-auto mb-3 h-6 w-6 text-brand-600" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={acceptByType[type]}
        multiple={isResume}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Browse files'}
      </Button>
    </div>
  );
}
