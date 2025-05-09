import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Establishment model
export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  rating: text("rating").default("5"),
  coverImage: text("cover_image"),
  userId: integer("user_id").notNull().default(1), // Default to user ID 1 for testing
  createdAt: timestamp("created_at").defaultNow(),
});

// Attachment files model
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  filePath: text("file_path").notNull(),
  establishmentId: integer("establishment_id").notNull(),
  userId: integer("user_id").notNull().default(1), // Default to user ID 1 for testing
  uploadDate: timestamp("upload_date").defaultNow(),
});

// Define the relationships
export const usersRelations = relations(users, ({ many }) => ({
  establishments: many(establishments),
  attachments: many(attachments),
}));

export const establishmentsRelations = relations(establishments, ({ one, many }) => ({
  user: one(users, {
    fields: [establishments.userId],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  establishment: one(establishments, {
    fields: [attachments.establishmentId],
    references: [establishments.id],
  }),
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
}));

// Establishment categories
export const ESTABLISHMENT_CATEGORIES = [
  'Restaurant',
  'Retail',
  'Services',
  'Entertainment'
] as const;

// Rating options
export const RATING_OPTIONS = [
  '5',
  '4.5',
  '4',
  '3.5',
  '3',
  '2.5',
  '2'
] as const;

// Location options
export const LOCATION_OPTIONS = [
  'Downtown',
  'Uptown',
  'Midtown',
  'Suburban'
] as const;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, 
  createdAt: true
});

export const insertEstablishmentSchema = createInsertSchema(establishments).omit({
  id: true,
  createdAt: true
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadDate: true
});

// Define the types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = z.infer<typeof insertEstablishmentSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

// Extended schemas for validation
export const userValidationSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export type UserValidation = z.infer<typeof userValidationSchema>;

// Firebase-specific types
export type FirebaseUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type FirebaseEstablishment = {
  id: string;
  name: string;
  category: string;
  location: string;
  description?: string;
  rating: string;
  coverImage?: string;
  userId?: string; // Make userId optional
  createdAt: Date;
};

export type FirebaseAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  filePath: string;
  establishmentId: string;
  userId: string;
  uploadDate: Date;
};
