import { createContext, useContext, useState, ReactNode } from "react";
import { 
  fetchEstablishments, 
  createEstablishment,
  fetchEstablishment,
  updateEstablishment,
  deleteEstablishment,
  fetchAttachments,
  createAttachment,
  deleteAttachment
} from "@/lib/adapters";
import { 
  uploadFile, 
  deleteFile 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { 
  FirebaseEstablishment, 
  FirebaseAttachment 
} from "@shared/schema";

// Define the context type
interface EstablishmentContextType {
  // Establishment CRUD
  addEstablishmentData: (data: Partial<Omit<FirebaseEstablishment, "id" | "createdAt">>) => Promise<FirebaseEstablishment>;
  getEstablishmentsData: (
    filters?: { category?: string; location?: string; rating?: string },
    sortBy?: string
  ) => Promise<FirebaseEstablishment[]>;
  getEstablishmentData: (id: string) => Promise<FirebaseEstablishment | null>;
  updateEstablishmentData: (id: string, data: Partial<FirebaseEstablishment>) => Promise<boolean>;
  deleteEstablishmentData: (id: string) => Promise<boolean>;
  
  // File operations
  uploadFileData: (
    file: File,
    establishmentId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ) => Promise<FirebaseAttachment>;
  getAttachmentsData: (establishmentId: string) => Promise<FirebaseAttachment[]>;
  deleteFileData: (attachment: FirebaseAttachment) => Promise<boolean>;
  
  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Create context with default values
const EstablishmentContext = createContext<EstablishmentContextType>({
  addEstablishmentData: () => Promise.reject("EstablishmentContext not initialized"),
  getEstablishmentsData: () => Promise.reject("EstablishmentContext not initialized"),
  getEstablishmentData: () => Promise.reject("EstablishmentContext not initialized"),
  updateEstablishmentData: () => Promise.reject("EstablishmentContext not initialized"),
  deleteEstablishmentData: () => Promise.reject("EstablishmentContext not initialized"),
  uploadFileData: () => Promise.reject("EstablishmentContext not initialized"),
  getAttachmentsData: () => Promise.reject("EstablishmentContext not initialized"),
  deleteFileData: () => Promise.reject("EstablishmentContext not initialized"),
  loading: false,
  setLoading: () => {},
});

// Hook to use the context
export const useEstablishment = () => useContext(EstablishmentContext);

// Provider component
export const EstablishmentProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Establishment functions with error handling
  const addEstablishmentData = async (data: Partial<Omit<FirebaseEstablishment, "id" | "createdAt">>) => {
    try {
      setLoading(true);
      const establishment = await createEstablishment(data);
      toast({
        title: "Establishment Added",
        description: "The establishment has been added successfully.",
      });
      return establishment;
    } catch (error: any) {
      toast({
        title: "Error Adding Establishment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEstablishmentsData = async (
    filters?: { category?: string; location?: string; rating?: string },
    sortBy?: string
  ) => {
    try {
      setLoading(true);
      return await fetchEstablishments(filters, sortBy);
    } catch (error: any) {
      toast({
        title: "Error Loading Establishments",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEstablishmentData = async (id: string) => {
    try {
      setLoading(true);
      return await fetchEstablishment(id);
    } catch (error: any) {
      toast({
        title: "Error Loading Establishment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEstablishmentData = async (id: string, data: Partial<FirebaseEstablishment>) => {
    try {
      setLoading(true);
      const result = await updateEstablishment(id, data);
      toast({
        title: "Establishment Updated",
        description: "The establishment has been updated successfully.",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Error Updating Establishment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEstablishmentData = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteEstablishment(id);
      toast({
        title: "Establishment Deleted",
        description: "The establishment has been deleted successfully.",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Error Deleting Establishment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // File functions with error handling
  const uploadFileData = async (
    file: File,
    establishmentId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ) => {
    try {
      const result = await uploadFile(file, establishmentId, userId, onProgress);
      toast({
        title: "File Uploaded",
        description: "The file has been uploaded successfully.",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Error Uploading File",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAttachmentsData = async (establishmentId: string) => {
    try {
      setLoading(true);
      return await fetchAttachments(establishmentId);
    } catch (error: any) {
      toast({
        title: "Error Loading Attachments",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteFileData = async (attachment: FirebaseAttachment) => {
    try {
      setLoading(true);
      const result = await deleteAttachment(attachment.id);
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Error Deleting File",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    addEstablishmentData,
    getEstablishmentsData,
    getEstablishmentData,
    updateEstablishmentData,
    deleteEstablishmentData,
    uploadFileData,
    getAttachmentsData,
    deleteFileData,
    loading,
    setLoading,
  };

  return (
    <EstablishmentContext.Provider value={value}>
      {children}
    </EstablishmentContext.Provider>
  );
};
