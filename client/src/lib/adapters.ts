import { 
  Establishment, 
  Attachment, 
  FirebaseEstablishment, 
  FirebaseAttachment 
} from "@shared/schema";
import { apiRequest, getQueryFn } from "./queryClient";

/**
 * Adapters to convert between Firebase and PostgreSQL data models
 */

// Convert PostgreSQL Establishment to Firebase format
export function toFirebaseEstablishment(dbEstablishment: Establishment): FirebaseEstablishment {
  return {
    id: dbEstablishment.id.toString(),
    name: dbEstablishment.name,
    category: dbEstablishment.category,
    location: dbEstablishment.location,
    description: dbEstablishment.description || undefined,
    rating: dbEstablishment.rating || "5",
    coverImage: dbEstablishment.coverImage || undefined,
    userId: dbEstablishment.userId.toString(),
    createdAt: dbEstablishment.createdAt || new Date(),
  };
}

// Convert PostgreSQL Attachment to Firebase format
export function toFirebaseAttachment(dbAttachment: Attachment): FirebaseAttachment {
  return {
    id: dbAttachment.id.toString(),
    fileName: dbAttachment.fileName,
    fileType: dbAttachment.fileType,
    fileSize: dbAttachment.fileSize,
    filePath: dbAttachment.filePath,
    establishmentId: dbAttachment.establishmentId.toString(),
    userId: dbAttachment.userId.toString(),
    uploadDate: dbAttachment.uploadDate || new Date(),
  };
}

// Fetch establishments from the API
export async function fetchEstablishments(
  filters?: { category?: string; location?: string; rating?: string },
  sortBy?: string
): Promise<FirebaseEstablishment[]> {
  try {
    // Build query string for filters
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.location) queryParams.append('location', filters.location);
    if (filters?.rating) queryParams.append('rating', filters.rating);
    if (sortBy) queryParams.append('sortBy', sortBy);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const establishments = await apiRequest<Establishment[]>(`/api/establishments${queryString}`, {
      method: 'GET'
    });
    
    return establishments.map(toFirebaseEstablishment);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    return [];
  }
}

// Fetch a single establishment by ID
export async function fetchEstablishment(id: string): Promise<FirebaseEstablishment | null> {
  try {
    const establishment = await apiRequest<Establishment>(`/api/establishments/${id}`, {
      method: 'GET'
    });
    
    return toFirebaseEstablishment(establishment);
  } catch (error) {
    console.error(`Error fetching establishment with ID ${id}:`, error);
    return null;
  }
}

// Create a new establishment
export async function createEstablishment(data: Partial<Omit<FirebaseEstablishment, "id" | "createdAt">>): Promise<FirebaseEstablishment> {
  try {
    // Ensure required fields are present
    if (!data.name || !data.category || !data.location) {
      throw new Error("Missing required fields: name, category, and location are required");
    }

    // Default rating to "5" if not provided
    const establishment = await apiRequest<Establishment>('/api/establishments', {
      method: 'POST',
      body: {
        name: data.name,
        category: data.category,
        location: data.location,
        description: data.description || '',
        rating: data.rating || '5',
        coverImage: data.coverImage || null,
        // userId will be handled by server
      }
    });
    
    return toFirebaseEstablishment(establishment);
  } catch (error) {
    console.error('Error creating establishment:', error);
    throw error;
  }
}

// Update an establishment
export async function updateEstablishment(
  id: string, 
  data: Partial<FirebaseEstablishment>
): Promise<boolean> {
  try {
    // Convert IDs to numbers if present
    const updateData: any = { ...data };
    
    if (updateData.userId) {
      updateData.userId = parseInt(updateData.userId);
    }
    
    // Remove fields that should not be updated
    delete updateData.id;
    delete updateData.createdAt;
    
    // Handle empty strings
    if (updateData.description === '') {
      updateData.description = null;
    }
    
    if (updateData.coverImage === '') {
      updateData.coverImage = null;
    }
    
    const result = await apiRequest<{ success: boolean }>(`/api/establishments/${id}`, {
      method: 'PATCH',
      body: updateData
    });
    
    return result.success;
  } catch (error) {
    console.error(`Error updating establishment with ID ${id}:`, error);
    return false;
  }
}

// Delete an establishment
export async function deleteEstablishment(id: string): Promise<boolean> {
  try {
    const result = await apiRequest<{ success: boolean }>(`/api/establishments/${id}`, {
      method: 'DELETE'
    });
    
    return result.success;
  } catch (error) {
    console.error(`Error deleting establishment with ID ${id}:`, error);
    return false;
  }
}

// Fetch attachments for an establishment
export async function fetchAttachments(establishmentId: string): Promise<FirebaseAttachment[]> {
  try {
    const attachments = await apiRequest<Attachment[]>(`/api/establishments/${establishmentId}/attachments`, {
      method: 'GET'
    });
    
    return attachments.map(toFirebaseAttachment);
  } catch (error) {
    console.error(`Error fetching attachments for establishment ${establishmentId}:`, error);
    return [];
  }
}

// Create a new attachment
export async function createAttachment(data: Omit<FirebaseAttachment, "id" | "uploadDate">): Promise<FirebaseAttachment> {
  try {
    // Ensure required fields are present
    if (!data.fileName || !data.fileType || !data.fileSize || !data.filePath || !data.establishmentId || !data.userId) {
      throw new Error("Missing required fields for attachment");
    }
    
    // Convert string IDs to numbers for the API
    const attachment = await apiRequest<Attachment>('/api/attachments', {
      method: 'POST',
      body: {
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        filePath: data.filePath,
        establishmentId: parseInt(data.establishmentId),
        userId: parseInt(data.userId),
      }
    });
    
    return toFirebaseAttachment(attachment);
  } catch (error) {
    console.error('Error creating attachment:', error);
    throw error;
  }
}

// Delete an attachment
export async function deleteAttachment(id: string): Promise<boolean> {
  try {
    const result = await apiRequest<{ success: boolean }>(`/api/attachments/${id}`, {
      method: 'DELETE'
    });
    
    return result.success;
  } catch (error) {
    console.error(`Error deleting attachment with ID ${id}:`, error);
    return false;
  }
}