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
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`establishments/${establishmentId}`);

    if (error) throw error;

    return data.map(item => ({
      id: item.name,
      fileName: item.name,
      fileType: item.metadata?.mimetype || 'application/octet-stream',
      fileSize: `${(item.metadata?.size / 1024 / 1024).toFixed(2)} MB`,
      filePath: supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`establishments/${establishmentId}/${item.name}`).data.publicUrl,
      establishmentId,
      userId: '', // This information might need to be stored separately
      uploadDate: new Date(item.created_at)
    }));
  } catch (error: any) {
    throw new Error(error.message || "Failed to get attachments");
  }
};

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
