import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import FileItem from "@/components/FileItem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FirebaseEstablishment, FirebaseAttachment } from "@shared/schema";
import { Helmet } from "react-helmet";

export default function EstablishmentDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { getEstablishmentData, getAttachmentsData, uploadFileData, deleteFileData, loading } = useEstablishment();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [establishment, setEstablishment] = useState<FirebaseEstablishment | null>(null);
  const [attachments, setAttachments] = useState<FirebaseAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load establishment data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const establishmentData = await getEstablishmentData(id);
        
        if (!establishmentData) {
          toast({
            title: "Establishment not found",
            description: "The establishment you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setEstablishment(establishmentData);
        
        // Load attachments
        const attachmentsData = await getAttachmentsData(id);
        setAttachments(attachmentsData);
      } catch (error: any) {
        toast({
          title: "Error loading data",
          description: error.message || "There was an error loading the establishment data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  // Get category badge color
  const getCategoryColor = (category?: string) => {
    if (!category) return "";
    
    switch (category) {
      case "Restaurant":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "Retail":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "Services":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "Entertainment":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!currentUser || !establishment) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload file with progress tracking
      await uploadFileData(
        file,
        establishment.id,
        currentUser.uid,
        (progress) => setUploadProgress(progress)
      );
      
      // Refresh attachments list
      const updatedAttachments = await getAttachmentsData(establishment.id);
      setAttachments(updatedAttachments);
      
      // Close modal and reset state
      setShowUploadModal(false);
      setUploadProgress(0);
      
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message || "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleFileDelete = async (attachment: FirebaseAttachment) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to delete files",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await deleteFileData(attachment);
      
      // Remove from attachments list
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete error",
        description: error.message || "There was an error deleting the file",
        variant: "destructive",
      });
    }
  };

  // Check if user can modify files (creator or admin)
  const canModifyFiles = () => {
    if (!currentUser || !establishment) return false;
    return currentUser.uid === establishment.userId;
  };

  return (
    <>
      <Helmet>
        <title>{establishment ? `${establishment.name} | EstablishmentDir` : "Establishment Details"}</title>
        <meta 
          name="description" 
          content={establishment ? `View details and attached files for ${establishment.name} - ${establishment.category} located in ${establishment.location}` : "Loading establishment details"} 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8 flex-1">
          {isLoading ? (
            <>
              <Skeleton className="h-64 w-full rounded-lg mb-6" />
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-6 w-20 mr-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-8 w-64 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
              </div>
              <Separator className="my-6" />
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />
              <Skeleton className="h-6 w-40 mb-4" />
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full mb-3" />
              ))}
            </>
          ) : establishment ? (
            <>
              <div className="relative mb-6">
                {establishment.coverImage ? (
                  <div className="h-64 rounded-lg overflow-hidden">
                    <img 
                      src={establishment.coverImage} 
                      alt={`${establishment.name} cover image`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300">{establishment.name}</h2>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className={`${getCategoryColor(establishment.category)} mr-2`}>
                      {establishment.category}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-current text-yellow-500 mr-1" />
                      <span className="font-medium">{establishment.rating}</span>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-semibold mb-1">{establishment.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {establishment.location}
                  </p>
                </div>
                
                {currentUser && (
                  <Button 
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 md:mt-0"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                  </Button>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h2 className="text-xl font-medium mb-4">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
                  {establishment.description || "No description provided."}
                </p>
                
                <h2 className="text-xl font-medium mb-4">Attached Files</h2>
                
                {attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <FileItem 
                        key={attachment.id} 
                        attachment={attachment}
                        onDelete={canModifyFiles() ? handleFileDelete : undefined}
                        allowDelete={canModifyFiles()}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No files attached to this establishment yet.</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Establishment not found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The establishment you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/")}>Go back to establishments</Button>
            </div>
          )}
        </main>
        
        {/* File upload modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a file to attach to {establishment?.name}. Supported formats include PDF, DOCX, XLSX, and images.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <FileUpload
                onFileSelect={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip"
                maxFileSize={25 * 1024 * 1024} // 25MB
                description="PDF, DOCX, images, ZIP up to 25MB"
                icon={<Upload className="h-10 w-10" />}
              />
              
              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center mt-2">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
