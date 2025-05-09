import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, FileText } from "lucide-react";
import type { FirebaseEstablishment } from "@shared/schema";

interface EstablishmentCardProps {
  establishment: FirebaseEstablishment;
  attachmentsCount?: number;
}

export default function EstablishmentCard({ establishment, attachmentsCount = 0 }: EstablishmentCardProps) {
  const getCategoryColor = (category: string) => {
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

  return (
    <Link href={`/establishments/${establishment.id}`}>
      <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer">
        {establishment.coverImage ? (
          <div className="h-48 w-full overflow-hidden">
            <img 
              src={establishment.coverImage} 
              alt={`${establishment.name} cover image`} 
              className="h-full w-full object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">{establishment.name}</span>
          </div>
        )}
        
        <CardContent className="p-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`${getCategoryColor(establishment.category)} px-2 py-0.5 text-xs font-medium`}>
              {establishment.category}
            </Badge>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-current text-yellow-500 mr-1" />
              <span className="text-sm font-medium">{establishment.rating}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-1">{establishment.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {establishment.location}
          </p>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {establishment.description || "No description available"}
          </p>
          
          <div className="mt-auto flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FileText className="h-4 w-4 mr-1" />
            {attachmentsCount} {attachmentsCount === 1 ? "document" : "documents"} available
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
