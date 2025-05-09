import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEstablishmentSchema, 
  insertAttachmentSchema,
  userValidationSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = app.route('/api');
  
  // -------------- User Routes --------------
  // Register user
  app.post("/api/users/register", async (req: Request, res: Response) => {
    try {
      const validatedData = userValidationSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // -------------- Establishment Routes --------------
  // Get all establishments with optional filters
  app.get("/api/establishments", async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        location: req.query.location as string | undefined,
        rating: req.query.rating as string | undefined
      };
      
      const sortBy = req.query.sortBy as string | undefined;
      
      const establishments = await storage.getEstablishments(filters, sortBy);
      res.json(establishments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get establishments" });
    }
  });

  // Get establishment by ID
  app.get("/api/establishments/:id", async (req: Request, res: Response) => {
    try {
      const establishmentId = parseInt(req.params.id);
      
      if (isNaN(establishmentId)) {
        return res.status(400).json({ error: "Invalid establishment ID" });
      }
      
      const establishment = await storage.getEstablishment(establishmentId);
      
      if (!establishment) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      
      res.json(establishment);
    } catch (error) {
      res.status(500).json({ error: "Failed to get establishment" });
    }
  });

  // Create establishment
  app.post("/api/establishments", async (req: Request, res: Response) => {
    try {
      // Add default userId of 1 if not provided
      const dataWithDefaults = {
        ...req.body,
        userId: req.body.userId || 1
      };
      
      const establishmentData = insertEstablishmentSchema.parse(dataWithDefaults);
      const newEstablishment = await storage.createEstablishment(establishmentData);
      res.status(201).json(newEstablishment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create establishment:", error);
      res.status(500).json({ error: "Failed to create establishment" });
    }
  });

  // Update establishment
  app.patch("/api/establishments/:id", async (req: Request, res: Response) => {
    try {
      const establishmentId = parseInt(req.params.id);
      
      if (isNaN(establishmentId)) {
        return res.status(400).json({ error: "Invalid establishment ID" });
      }
      
      const establishment = await storage.getEstablishment(establishmentId);
      
      if (!establishment) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      
      const updatedEstablishment = await storage.updateEstablishment(establishmentId, req.body);
      res.json({ success: updatedEstablishment });
    } catch (error) {
      res.status(500).json({ error: "Failed to update establishment" });
    }
  });

  // Delete establishment
  app.delete("/api/establishments/:id", async (req: Request, res: Response) => {
    try {
      const establishmentId = parseInt(req.params.id);
      
      if (isNaN(establishmentId)) {
        return res.status(400).json({ error: "Invalid establishment ID" });
      }
      
      const establishment = await storage.getEstablishment(establishmentId);
      
      if (!establishment) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      
      const deleted = await storage.deleteEstablishment(establishmentId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete establishment" });
    }
  });

  // -------------- Attachment Routes --------------
  // Get all attachments for an establishment
  app.get("/api/establishments/:id/attachments", async (req: Request, res: Response) => {
    try {
      const establishmentId = parseInt(req.params.id);
      
      if (isNaN(establishmentId)) {
        return res.status(400).json({ error: "Invalid establishment ID" });
      }
      
      const establishment = await storage.getEstablishment(establishmentId);
      
      if (!establishment) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      
      const attachments = await storage.getAttachments(establishmentId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attachments" });
    }
  });

  // Create attachment
  app.post("/api/attachments", async (req: Request, res: Response) => {
    try {
      // Add default userId of 1 if not provided
      const dataWithDefaults = {
        ...req.body,
        userId: req.body.userId || 1
      };
      
      const attachmentData = insertAttachmentSchema.parse(dataWithDefaults);
      
      // Verify establishment exists
      if (typeof attachmentData.establishmentId === 'number') {
        const establishment = await storage.getEstablishment(attachmentData.establishmentId);
        if (!establishment) {
          return res.status(404).json({ error: "Establishment not found" });
        }
      } else {
        return res.status(400).json({ error: "Invalid establishment ID" });
      }
      
      const newAttachment = await storage.createAttachment(attachmentData);
      res.status(201).json(newAttachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create attachment:", error);
      res.status(500).json({ error: "Failed to create attachment" });
    }
  });

  // Delete attachment
  app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
    try {
      const attachmentId = parseInt(req.params.id);
      
      if (isNaN(attachmentId)) {
        return res.status(400).json({ error: "Invalid attachment ID" });
      }
      
      const deleted = await storage.deleteAttachment(attachmentId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
