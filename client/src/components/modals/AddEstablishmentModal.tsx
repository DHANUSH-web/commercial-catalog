import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ESTABLISHMENT_CATEGORIES, 
  RATING_OPTIONS, 
  LOCATION_OPTIONS 
} from "@shared/schema";

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(1, "Please select a category"),
  location: z.string().min(1, "Please enter a location"),
  description: z.string().optional(),
  rating: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEstablishmentAdded?: () => void;
}

export default function AddEstablishmentModal({ 
  isOpen, 
  onClose,
  onEstablishmentAdded,
}: AddEstablishmentModalProps) {
  const { addEstablishmentData, uploadFileData } = useEstablishment();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      location: "",
      description: "",
      rating: "5",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Create establishment
      const establishment = await addEstablishmentData({
        name: data.name,
        category: data.category,
        location: data.location,
        description: data.description || "",
        rating: data.rating || "5",
        // userId will be handled by the server
      });

      // Get user ID for uploads, defaulting to "1" if not logged in
      const userId = currentUser?.uid || "1";
      
      // Upload cover image if provided
      if (uploadedImage) {
        // Upload and update establishment with cover image
        await uploadFileData(uploadedImage, establishment.id, userId);
      }

      // Upload additional files
      if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map((file) => 
          uploadFileData(file, establishment.id, userId)
        );
        await Promise.all(uploadPromises);
      }

      // Reset form
      form.reset();
      setUploadedImage(null);
      setUploadedFiles([]);
      
      // Close modal and notify parent
      onClose();
      if (onEstablishmentAdded) {
        onEstablishmentAdded();
      }
      
      // Show success message
      toast({
        title: "Establishment added",
        description: "The establishment has been added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error adding establishment",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = (file: File) => {
    setUploadedImage(file);
  };

  // Handle document upload
  const handleDocumentUpload = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  // Remove document
  const removeDocument = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add New Establishment</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new establishment to the directory.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter establishment name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTABLISHMENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATING_OPTIONS.map((rating) => (
                          <SelectItem key={rating} value={rating}>
                            {rating} stars
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location (e.g., Downtown, 123 Main St)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter establishment description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Cover Image</FormLabel>
              <FileUpload
                onFileSelect={handleCoverImageUpload}
                accept="image/*"
                maxFileSize={5242880} // 5MB
                description="PNG, JPG, GIF up to 5MB"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
              />
              {uploadedImage && (
                <div className="mt-2 bg-muted/50 p-2 rounded-md flex items-center justify-between">
                  <span className="text-sm truncate">{uploadedImage.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setUploadedImage(null)}
                    type="button"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div>
              <FormLabel className="block mb-2">Documents</FormLabel>
              <FileUpload
                onFileSelect={handleDocumentUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                maxFileSize={25 * 1024 * 1024} // 25MB
                description="PDF, DOCX, XLSX, ZIP up to 25MB each"
                multiple={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="bg-muted/50 p-2 rounded-md flex items-center justify-between">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeDocument(index)}
                        type="button"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Establishment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
