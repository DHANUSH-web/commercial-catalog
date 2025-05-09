import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import type { FirebaseEstablishment } from "@shared/schema";

// Collections
const ESTABLISHMENTS_COLLECTION = "establishments";
const ATTACHMENTS_COLLECTION = "attachments";

// Add a new establishment
export const addEstablishment = async (establishmentData: Omit<FirebaseEstablishment, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, ESTABLISHMENTS_COLLECTION), {
      ...establishmentData,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...establishmentData,
      createdAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to add establishment");
  }
};

// Helper function to convert Firebase document to our type
const convertDocToEstablishment = (doc: DocumentData): FirebaseEstablishment => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    category: data.category,
    location: data.location,
    description: data.description || "",
    rating: data.rating || "5",
    coverImage: data.coverImage || "",
    userId: data.userId,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
};

// Get all establishments
export const getEstablishments = async (
  filters?: {
    category?: string;
    location?: string;
    rating?: string;
  },
  sortBy: string = "createdAt"
): Promise<FirebaseEstablishment[]> => {
  try {
    let establishmentsQuery = collection(db, ESTABLISHMENTS_COLLECTION);
    let queryConstraints = [];
    
    // Add filters if provided
    if (filters) {
      if (filters.category && filters.category !== "All categories") {
        queryConstraints.push(where("category", "==", filters.category));
      }
      
      if (filters.location && filters.location !== "All locations") {
        queryConstraints.push(where("location", "==", filters.location));
      }
      
      if (filters.rating && filters.rating !== "All ratings") {
        if (filters.rating === "5 stars") {
          queryConstraints.push(where("rating", "==", "5"));
        } else if (filters.rating === "4+ stars") {
          queryConstraints.push(where("rating", ">=", "4"));
        } else if (filters.rating === "3+ stars") {
          queryConstraints.push(where("rating", ">=", "3"));
        }
      }
    }
    
    // Add sort
    let sortOrder: "asc" | "desc" = "desc";
    let sortField = "createdAt";
    
    if (sortBy === "Newest first") {
      sortField = "createdAt";
      sortOrder = "desc";
    } else if (sortBy === "Highest rated") {
      sortField = "rating";
      sortOrder = "desc";
    } else if (sortBy === "Name A-Z") {
      sortField = "name";
      sortOrder = "asc";
    } else if (sortBy === "Name Z-A") {
      sortField = "name";
      sortOrder = "desc";
    }
    
    queryConstraints.push(orderBy(sortField, sortOrder));
    
    // Execute query
    const q = query(establishmentsQuery, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    // Convert to our type
    return querySnapshot.docs.map(convertDocToEstablishment);
  } catch (error: any) {
    throw new Error(error.message || "Failed to get establishments");
  }
};

// Get establishment by ID
export const getEstablishmentById = async (id: string): Promise<FirebaseEstablishment | null> => {
  try {
    const docRef = doc(db, ESTABLISHMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt ? (docSnap.data().createdAt as Timestamp).toDate() : new Date(),
    } as FirebaseEstablishment;
  } catch (error: any) {
    throw new Error(error.message || "Failed to get establishment");
  }
};

// Update establishment
export const updateEstablishment = async (id: string, data: Partial<FirebaseEstablishment>) => {
  try {
    const establishmentRef = doc(db, ESTABLISHMENTS_COLLECTION, id);
    await updateDoc(establishmentRef, data);
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update establishment");
  }
};

// Delete establishment
export const deleteEstablishment = async (id: string) => {
  try {
    const establishmentRef = doc(db, ESTABLISHMENTS_COLLECTION, id);
    await deleteDoc(establishmentRef);
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete establishment");
  }
};
