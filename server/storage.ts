import { db } from "./db";
import {
  keys, validations, blacklist,
  type Key, type InsertKey, type Validation, type InsertBlacklist, type BlacklistEntry
} from "@shared/schema";
import { eq, sql, desc, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Keys
  createKey(key: InsertKey): Promise<Key>;
  getKey(keyStr: string): Promise<Key | undefined>;
  listKeys(): Promise<Key[]>;
  deleteKey(id: number): Promise<void>;
  incrementKeyUses(id: number): Promise<void>;
  
  // Validation Logs
  logValidation(keyId: number, hwid: string | null, ip: string | null, userAgent: string | null): Promise<Validation>;
  
  // Blacklist
  getBlacklistEntry(hwid: string): Promise<BlacklistEntry | undefined>;
  listBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(entry: InsertBlacklist): Promise<BlacklistEntry>;
  removeFromBlacklist(id: number): Promise<void>;

  // Stats
  getStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalValidations: number;
    bannedUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async createKey(insertKey: InsertKey): Promise<Key> {
    const [key] = await db.insert(keys).values(insertKey).returning();
    return key;
  }

  async getKey(keyStr: string): Promise<Key | undefined> {
    const [key] = await db.select().from(keys).where(eq(keys.key, keyStr));
    return key;
  }

  async listKeys(): Promise<Key[]> {
    return await db.select().from(keys).orderBy(desc(keys.createdAt));
  }

  async deleteKey(id: number): Promise<void> {
    // We might want to just soft delete or revoke, but for now delete
    await db.delete(keys).where(eq(keys.id, id));
  }

  async incrementKeyUses(id: number): Promise<void> {
    await db.update(keys)
      .set({ uses: sql`${keys.uses} + 1` })
      .where(eq(keys.id, id));
  }

  async logValidation(keyId: number, hwid: string | null, ip: string | null, userAgent: string | null): Promise<Validation> {
    const [validation] = await db.insert(validations).values({
      keyId,
      hwid,
      ip,
      userAgent,
    }).returning();
    return validation;
  }

  async getBlacklistEntry(hwid: string): Promise<BlacklistEntry | undefined> {
    const [entry] = await db.select().from(blacklist).where(eq(blacklist.hwid, hwid));
    return entry;
  }

  async listBlacklist(): Promise<BlacklistEntry[]> {
    return await db.select().from(blacklist).orderBy(desc(blacklist.bannedAt));
  }

  async addToBlacklist(entry: InsertBlacklist): Promise<BlacklistEntry> {
    const [newItem] = await db.insert(blacklist).values(entry).returning();
    return newItem;
  }

  async removeFromBlacklist(id: number): Promise<void> {
    await db.delete(blacklist).where(eq(blacklist.id, id));
  }

  async getStats() {
    const [keyCount] = await db.select({ count: sql<number>`count(*)` }).from(keys);
    const [activeKeyCount] = await db.select({ count: sql<number>`count(*)` }).from(keys).where(eq(keys.isRevoked, false));
    const [validationCount] = await db.select({ count: sql<number>`count(*)` }).from(validations);
    const [banCount] = await db.select({ count: sql<number>`count(*)` }).from(blacklist);

    return {
      totalKeys: Number(keyCount.count),
      activeKeys: Number(activeKeyCount.count),
      totalValidations: Number(validationCount.count),
      bannedUsers: Number(banCount.count),
    };
  }
}

export const storage = new DatabaseStorage();
