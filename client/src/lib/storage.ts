import { createClient } from '@supabase/supabase-js';
import type { FirebaseAttachment } from "@shared/schema";

const supabase = createClient(
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL!,
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
    }
  }
);

const BUCKET_NAME = 'attachments';

// Upload a file to storage and add metadata
export const uploadFile = async (
  file: File,
  establishmentId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<FirebaseAttachment> => {
  try {
    // Create a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = `establishments/${establishmentId}/${fileName}`;

    // Upload file to Supabase Storage with metadata
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        duplex: 'half',
        metadata: {
          userId,
          establishmentId,
          contentType: file.type,
        }
      });

    if (error) throw new Error('Upload failed: ' + error.message);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Create the attachment metadata
    const fileData = {
      id: data.path, // Using the path as ID
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      filePath: publicUrl,
      establishmentId,
      userId,
      uploadDate: new Date()
    };

    return fileData as FirebaseAttachment;
  } catch (error: any) {
    throw new Error(error.message || "Failed to upload file");
  }
};

// Get all attachments for an establishment
export const getAttachments = async (establishmentId: string): Promise<FirebaseAttachment[]> => {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`establishments/${establishmentId}`);

    if (error) throw error;
    if (!files) return [];

    const attachments = await Promise.all(files.map(async (item) => {
      const filePath = `establishments/${establishmentId}/${item.name}`;
      const { data: fileData } = await supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        id: item.id || item.name,
        fileName: item.name,
        fileType: item.metadata?.mimetype || getFileType(item.name),
        fileSize: formatFileSize(item.metadata?.size || 0),
        filePath: fileData.publicUrl,
        establishmentId,
        userId: item.metadata?.userId || '',
        uploadDate: new Date(item.created_at || Date.now())
      };
    }));

    return attachments;
  } catch (error: any) {
    throw new Error(error.message || "Failed to get attachments");
  }
};

// Helper function to get file type from extension
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Delete a file from storage
export const deleteFile = async (attachment: FirebaseAttachment): Promise<boolean> => {
  try {
    // Extract the file path from the public URL
    const fileUrl = new URL(attachment.filePath);
    const filePath = fileUrl.pathname.split('/').slice(-3).join('/'); // Get last 3 segments

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete file");
  }
};
