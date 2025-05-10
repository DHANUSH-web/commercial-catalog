import { useState, useEffect } from "react";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import EstablishmentCard from "@/components/EstablishmentCard";
import AddEstablishmentModal from "@/components/modals/AddEstablishmentModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { FirebaseEstablishment, FirebaseAttachment } from "@shared/schema";
import { ESTABLISHMENT_CATEGORIES, LOCATION_OPTIONS } from "@shared/schema";
import { Helmet } from "react-helmet";

export default function Establishments() {
  const { getEstablishmentsData, getAttachmentsData, loading } = useEstablishment();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [establishments, setEstablishments] = useState<FirebaseEstablishment[]>([]);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("All categories");
  const [locationFilter, setLocationFilter] = useState<string>("All locations");
  const [ratingFilter, setRatingFilter] = useState<string>("All ratings");
  const [sortBy, setSortBy] = useState<string>("Newest first");

  // Load establishments
  const loadEstablishments = async () => {
    try {
      setIsLoading(true);
      const filters: { category?: string; location?: string; rating?: string } = {};
      
      if (categoryFilter !== "All categories") {
        filters.category = categoryFilter;
      }
      
      if (locationFilter !== "All locations") {
        filters.location = locationFilter;
      }
      
      if (ratingFilter !== "All ratings") {
        filters.rating = ratingFilter;
      }
      
      const data = await getEstablishmentsData(filters, sortBy);
      setEstablishments(data);
      
      // Load attachment counts for each establishment using Supabase
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (establishment) => {
          try {
            const attachments = await getAttachmentsData(establishment.id);
            counts[establishment.id] = attachments.length;
          } catch (error) {
            console.error(`Error loading attachments for ${establishment.id}:`, error);
            counts[establishment.id] = 0;
          }
        })
      );
      
      setAttachmentCounts(counts);
    } catch (error: any) {
      toast({
        title: "Error loading establishments",
        description: error.message || "There was an error loading the establishments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load establishments on mount and filter changes
  useEffect(() => {
    loadEstablishments();
  }, [categoryFilter, locationFilter, ratingFilter, sortBy]);

  // Handle add establishment button click
  const handleAddEstablishment = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add an establishment",
        variant: "destructive",
      });
      return;
    }
    setShowAddModal(true);
  };

  return (
    <>
      <Helmet>
        <title>Establishments Directory | EstablishmentDir</title>
        <meta name="description" content="Browse and discover commercial establishments including restaurants, retail stores, services, and entertainment venues." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold">Establishments</h1>
            
            <div className="mt-4 sm:mt-0">
              <Button onClick={handleAddEstablishment}>
                <Plus className="mr-2 h-4 w-4" /> Add Establishment
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select onValueChange={setCategoryFilter} defaultValue={categoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All categories">All categories</SelectItem>
                      {ESTABLISHMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Select onValueChange={setLocationFilter} defaultValue={locationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All locations">All locations</SelectItem>
                      {LOCATION_OPTIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <Select onValueChange={setRatingFilter} defaultValue={ratingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All ratings">All ratings</SelectItem>
                      <SelectItem value="5 stars">5 stars</SelectItem>
                      <SelectItem value="4+ stars">4+ stars</SelectItem>
                      <SelectItem value="3+ stars">3+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Sort by</label>
                  <Select onValueChange={setSortBy} defaultValue={sortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Newest first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Newest first">Newest first</SelectItem>
                      <SelectItem value="Highest rated">Highest rated</SelectItem>
                      <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                      <SelectItem value="Name Z-A">Name Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Establishment list */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : establishments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishments.map((establishment) => (
                <EstablishmentCard
                  key={establishment.id}
                  establishment={establishment}
                  attachmentsCount={attachmentCounts[establishment.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No establishments found</h3>
              <p className="text-muted-foreground mb-6">There are no establishments matching your filters.</p>
              <Button onClick={handleAddEstablishment}>
                <Plus className="mr-2 h-4 w-4" /> Add Establishment
              </Button>
            </div>
          )}
          
          {/* Pagination - to be implemented when needed */}
          {establishments.length > 0 && (
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex rounded-md shadow" aria-label="Pagination">
                <Button variant="outline" className="rounded-l-md">
                  <span className="sr-only">Previous</span>
                  Previous
                </Button>
                <Button variant="outline" className="rounded-none bg-primary text-primary-foreground">
                  1
                </Button>
                <Button variant="outline" className="rounded-none">
                  2
                </Button>
                <Button variant="outline" className="rounded-none">
                  3
                </Button>
                <Button variant="outline" className="rounded-r-md">
                  <span className="sr-only">Next</span>
                  Next
                </Button>
              </nav>
            </div>
          )}
        </main>
        
        {/* Add establishment modal */}
        <AddEstablishmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onEstablishmentAdded={loadEstablishments}
        />
      </div>
    </>
  );
}
