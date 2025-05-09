import { 
  users, establishments, attachments, 
  type User, type InsertUser,
  type Establishment, type InsertEstablishment,
  type Attachment, type InsertAttachment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, like, SQL } from "drizzle-orm";

// Storage Interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Establishment methods
  getEstablishments(filters?: {
    category?: string;
    location?: string;
    rating?: string;
  }, sortBy?: string): Promise<Establishment[]>;
  getEstablishment(id: number): Promise<Establishment | undefined>;
  createEstablishment(establishment: InsertEstablishment): Promise<Establishment>;
  updateEstablishment(id: number, data: Partial<Establishment>): Promise<boolean>;
  deleteEstablishment(id: number): Promise<boolean>;

  // Attachment methods
  getAttachments(establishmentId: number): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Establishment methods
  async getEstablishments(
    filters?: {
      category?: string;
      location?: string;
      rating?: string;
    },
    sortBy: string = "createdAt"
  ): Promise<Establishment[]> {
    // Build our SQL conditions
    const conditions: SQL[] = [];
    
    if (filters) {
      if (filters.category && filters.category !== "All categories") {
        conditions.push(eq(establishments.category, filters.category));
      }
      
      if (filters.location && filters.location !== "All locations") {
        conditions.push(eq(establishments.location, filters.location));
      }
      
      if (filters.rating && filters.rating !== "All ratings") {
        if (filters.rating === "5 stars") {
          conditions.push(eq(establishments.rating, "5"));
        } else if (filters.rating === "4+ stars") {
          conditions.push(gte(establishments.rating, "4"));
        } else if (filters.rating === "3+ stars") {
          conditions.push(gte(establishments.rating, "3"));
        }
      }
    }
    
    // Execute the query with the appropriate conditions and sorting
    if (conditions.length === 0) {
      // No filters, just apply sorting
      if (sortBy === "Newest first" || sortBy === "createdAt") {
        return db.select().from(establishments).orderBy(desc(establishments.createdAt));
      } else if (sortBy === "Highest rated") {
        return db.select().from(establishments).orderBy(desc(establishments.rating));
      } else if (sortBy === "Name A-Z") {
        return db.select().from(establishments).orderBy(establishments.name);
      } else if (sortBy === "Name Z-A") {
        return db.select().from(establishments).orderBy(desc(establishments.name));
      } else {
        return db.select().from(establishments);
      }
    } else {
      // Apply filters and sorting
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      if (sortBy === "Newest first" || sortBy === "createdAt") {
        return db.select().from(establishments)
          .where(whereCondition)
          .orderBy(desc(establishments.createdAt));
      } else if (sortBy === "Highest rated") {
        return db.select().from(establishments)
          .where(whereCondition)
          .orderBy(desc(establishments.rating));
      } else if (sortBy === "Name A-Z") {
        return db.select().from(establishments)
          .where(whereCondition)
          .orderBy(establishments.name);
      } else if (sortBy === "Name Z-A") {
        return db.select().from(establishments)
          .where(whereCondition)
          .orderBy(desc(establishments.name));
      } else {
        return db.select().from(establishments)
          .where(whereCondition);
      }
    }
  }

  async getEstablishment(id: number): Promise<Establishment | undefined> {
    const result = await db.select().from(establishments).where(eq(establishments.id, id));
    return result[0];
  }

  async createEstablishment(establishment: InsertEstablishment): Promise<Establishment> {
    const result = await db.insert(establishments).values(establishment).returning();
    return result[0];
  }

  async updateEstablishment(id: number, data: Partial<Establishment>): Promise<boolean> {
    const result = await db.update(establishments)
      .set(data)
      .where(eq(establishments.id, id))
      .returning({ id: establishments.id });
    
    return result.length > 0;
  }

  async deleteEstablishment(id: number): Promise<boolean> {
    // First delete all attachments
    await db.delete(attachments).where(eq(attachments.establishmentId, id));
    
    // Then delete the establishment
    const result = await db.delete(establishments)
      .where(eq(establishments.id, id))
      .returning({ id: establishments.id });
    
    return result.length > 0;
  }

  // Attachment methods
  async getAttachments(establishmentId: number): Promise<Attachment[]> {
    const result = await db.select()
      .from(attachments)
      .where(eq(attachments.establishmentId, establishmentId));
    return result;
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(attachment).returning();
    return result[0];
  }

  async deleteAttachment(id: number): Promise<boolean> {
    const result = await db.delete(attachments)
      .where(eq(attachments.id, id))
      .returning({ id: attachments.id });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
