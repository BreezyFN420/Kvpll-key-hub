import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomUUID } from "crypto";
import { addDays } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Middleware to check ADMIN_TOKEN
  const requireAdmin = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    const envToken = process.env.ADMIN_TOKEN;

    if (!envToken || token !== envToken) {
      return res.status(401).json({ message: "Unauthorized: Invalid Admin Token" });
    }
    next();
  };

  // --- Public Endpoints ---

  // Validate Key (from Lua script)
  app.post(api.script.validate.path, async (req, res) => {
    try {
      const { key: keyStr, hwid } = api.script.validate.input.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers['user-agent'] || "unknown";

      // 1. Check Blacklist
      if (hwid) {
        const banned = await storage.getBlacklistEntry(hwid);
        if (banned) {
          return res.status(403).json({ 
            valid: false, 
            message: `You are banned. Reason: ${banned.reason || "No reason provided"}` 
          });
        }
      }

      // 2. Check Key Existence
      const key = await storage.getKey(keyStr);
      if (!key) {
        return res.status(200).json({ valid: false, message: "Invalid key" });
      }

      // 3. Check Revoked
      if (key.isRevoked) {
        return res.status(200).json({ valid: false, message: "Key is revoked" });
      }

      // 4. Check Expiration
      if (key.expiresAt && new Date() > key.expiresAt) {
        return res.status(200).json({ valid: false, message: "Key expired" });
      }

      // 5. Check Max Uses
      if (key.maxUses > 0 && key.uses >= key.maxUses) {
        return res.status(200).json({ valid: false, message: "Max uses reached" });
      }

      // 6. Log Validation & Increment
      await storage.incrementKeyUses(key.id);
      await storage.logValidation(key.id, hwid || null, String(ip), String(userAgent));

      return res.status(200).json({ valid: true, message: "Key validated successfully" });

    } catch (err) {
      console.error("Validation error:", err);
      return res.status(400).json({ valid: false, message: "Bad request" });
    }
  });

  // Get Lua Script Template
  app.get(api.script.generate.path, (req, res) => {
    // Dynamically generate the Lua script with the correct URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}`;
    
    const luaScript = `-- Evade Key System Client
local API_URL = "${apiUrl}"
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Get Hardware ID (using RBX User ID for simplicity in this template, typically executors provide gethwid())
local function getHWID()
    -- Most executors support gethwid()
    if gethwid then return gethwid() end
    return tostring(LocalPlayer.UserId)
end

local function validateKey(keyInput)
    local hwid = getHWID()
    
    local success, response = pcall(function()
        return HttpService:PostAsync(
            API_URL .. "/api/validate",
            HttpService:JSONEncode({
                key = keyInput,
                hwid = hwid
            }),
            Enum.HttpContentType.ApplicationJson
        )
    end)

    if success then
        local data = HttpService:JSONDecode(response)
        if data.valid then
            print("✅ Key Validated!")
            return true
        else
            warn("❌ Validation Failed: " .. (data.message or "Unknown error"))
            return false
        end
    else
        warn("⚠️ Connection Failed: " .. tostring(response))
        return false
    end
end

-- Example Usage:
-- local userKey = "YOUR_KEY_HERE"
-- if validateKey(userKey) then
--     print("Script loading...")
--     -- Load your script here
-- end

return validateKey
`;
    res.json({ script: luaScript });
  });


  // --- Admin Endpoints ---

  app.post(api.admin.auth.path, async (req, res) => {
    // Just validation for the frontend login form
    const { token } = req.body;
    if (token === process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.get(api.admin.stats.path, requireAdmin, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get(api.admin.keys.list.path, requireAdmin, async (req, res) => {
    const keys = await storage.listKeys();
    res.json(keys);
  });

  app.post(api.admin.keys.create.path, requireAdmin, async (req, res) => {
    try {
      // Handle the custom duration logic
      const { durationDays, ...rest } = req.body;
      let expiresAt: Date | undefined;
      
      if (durationDays) {
        expiresAt = addDays(new Date(), durationDays);
      }

      // If no key provided, generate one
      const keyStr = rest.key || randomUUID().substring(0, 8).toUpperCase();

      const newKey = await storage.createKey({
        ...rest,
        key: keyStr,
        expiresAt,
      });
      res.status(201).json(newKey);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      // Check for unique constraint violation
      res.status(400).json({ message: "Failed to create key. Key might already exist." });
    }
  });

  app.delete(api.admin.keys.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteKey(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.admin.blacklist.list.path, requireAdmin, async (req, res) => {
    const list = await storage.listBlacklist();
    res.json(list);
  });

  app.post(api.admin.blacklist.add.path, requireAdmin, async (req, res) => {
    try {
      const entry = await storage.addToBlacklist(req.body);
      res.status(201).json(entry);
    } catch (err) {
       res.status(400).json({ message: "Failed to ban user. Probably already banned." });
    }
  });

  app.delete(api.admin.blacklist.remove.path, requireAdmin, async (req, res) => {
    await storage.removeFromBlacklist(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
