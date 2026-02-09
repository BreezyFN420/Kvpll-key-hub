import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Keys for the script
export const keys = pgTable("keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  note: text("note"), // Optional note about who this key is for
  maxUses: integer("max_uses").default(1).notNull(),
  uses: integer("uses").default(0).notNull(),
  expiresAt: timestamp("expires_at"), // Null means never expires
  isRevoked: boolean("is_revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Logs of successful validations
export const validations = pgTable("validations", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").references(() => keys.id),
  hwid: text("hwid"), // Hardware ID from the script
  ip: text("ip"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Banned users/HWIDs
export const blacklist = pgTable("blacklist", {
  id: serial("id").primaryKey(),
  hwid: text("hwid").unique(), // Ban by HWID
  ip: text("ip"), // Optional: Ban by IP
  reason: text("reason"),
  bannedAt: timestamp("banned_at").defaultNow().notNull(),
});

// === SCHEMAS ===

export const insertKeySchema = createInsertSchema(keys).omit({ 
  id: true, 
  uses: true, 
  createdAt: true 
}).extend({
  // Add constraints if needed, e.g., durationInDays to calculate expiresAt
  durationDays: z.number().optional(), 
});

export const insertBlacklistSchema = createInsertSchema(blacklist).omit({ 
  id: true, 
  bannedAt: true 
});

// === TYPES ===

export type Key = typeof keys.$inferSelect;
export type InsertKey = z.infer<typeof insertKeySchema>;

export type Validation = typeof validations.$inferSelect;
export type BlacklistEntry = typeof blacklist.$inferSelect;
export type InsertBlacklist = z.infer<typeof insertBlacklistSchema>;

// API Request/Response Types
export type CreateKeyRequest = InsertKey;
export type ValidateKeyRequest = {
  key: string;
  hwid: string;
};

export type ValidationResponse = {
  valid: boolean;
  message: string;
};

export type ScriptConfigResponse = {
  script: string;
};
