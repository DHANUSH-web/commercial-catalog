import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxFileSize?: number; // in bytes
  label?: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  multiple?: boolean;
};

export function FileUpload({
  onFileSelect,
  accept = "*",
  maxFileSize = 10485760, // 10MB default
  label = "Upload a file",
  description = "PNG, JPG, GIF up to 10MB",
  className,
  icon,
  multiple = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    processFiles(multiple ? Array.from(files) : [files[0]]);
  };

  const processFiles = (files: File[]) => {
    setError(null);
    
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        setError(`File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB.`);
        return;
      }
      
      // If accept attribute is set, validate file type
      if (accept && accept !== "*") {
        const fileType = file.type;
        const acceptTypes = accept.split(",").map(type => type.trim());
        const isValidType = acceptTypes.some(type => {
          if (type.startsWith(".")) {
            // Check extension
            return file.name.endsWith(type);
          } else if (type.endsWith("/*")) {
            // Check mime type group (like image/*)
            const typeGroup = type.split("/")[0];
            return fileType.startsWith(`${typeGroup}/`);
          } else {
            // Check exact mime type
            return fileType === type;
          }
        });
        
        if (!isValidType) {
          setError(`Invalid file type. Accepted: ${accept}`);
          return;
        }
      }
      
      // File is valid, pass it to the parent
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    processFiles(multiple ? Array.from(files) : [files[0]]);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <Card 
        className={cn(
          "border-dashed cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "",
          error ? "border-destructive bg-destructive/5" : ""
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-6 flex flex-col items-center justify-center space-y-2 text-center">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            multiple={multiple}
          />
          
          <div className="text-4xl text-muted-foreground mb-2">
            {icon || <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="font-medium text-primary">{label}</span>
            <span className="text-muted-foreground">or drag and drop</span>
          </div>
          
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
