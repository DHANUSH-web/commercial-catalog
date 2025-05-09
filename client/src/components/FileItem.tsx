import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, FileSpreadsheet, FileText, FileImage, FileArchive, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import type { FirebaseAttachment } from "@shared/schema";

interface FileItemProps {
  attachment: FirebaseAttachment;
  onDelete?: (attachment: FirebaseAttachment) => Promise<void>;
  allowDelete?: boolean;
}

export default function FileItem({ attachment, onDelete, allowDelete = false }: FileItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    const { fileType } = attachment;
    
    if (fileType.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("xlsx")) {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    } else if (fileType.includes("image")) {
      return <FileImage className="h-6 w-6 text-purple-500" />;
    } else if (fileType.includes("zip") || fileType.includes("archive") || fileType.includes("compressed")) {
      return <FileArchive className="h-6 w-6 text-yellow-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  // Get appropriate background color based on file type
  const getFileBackground = () => {
    const { fileType } = attachment;
    
    if (fileType.includes("pdf")) {
      return "bg-red-100 dark:bg-red-900/40";
    } else if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("xlsx")) {
      return "bg-green-100 dark:bg-green-900/40";
    } else if (fileType.includes("image")) {
      return "bg-purple-100 dark:bg-purple-900/40";
    } else if (fileType.includes("zip") || fileType.includes("archive") || fileType.includes("compressed")) {
      return "bg-yellow-100 dark:bg-yellow-900/40";
    } else {
      return "bg-blue-100 dark:bg-blue-900/40";
    }
  };

  // Format upload date
  const getFormattedDate = () => {
    return format(new Date(attachment.uploadDate), "MMM d, yyyy");
  };

  // Handle file download
  const handleDownload = () => {
    window.open(attachment.filePath, "_blank");
  };

  // Handle file deletion
  const handleDelete = async () => {
    if (onDelete) {
      try {
        setIsDeleting(true);
        await onDelete(attachment);
      } catch (error) {
        console.error("Error deleting file:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="flex flex-row items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className={`h-10 w-10 rounded-md ${getFileBackground()} flex items-center justify-center mr-3`}>
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Added {getFormattedDate()} • {attachment.fileSize}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" size="icon" onClick={handleDownload} title="Download file">
          <Download className="h-4 w-4" />
        </Button>
        
        {allowDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" title="Delete file">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the file.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
