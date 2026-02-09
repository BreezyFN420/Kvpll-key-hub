import { z } from 'zod';
import { insertKeySchema, insertBlacklistSchema, keys, validations, blacklist } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Public Endpoint for the Lua Script
  script: {
    validate: {
      method: 'POST' as const,
      path: '/api/validate' as const,
      input: z.object({
        key: z.string().min(1),
        hwid: z.string().optional(), // Optional, but recommended for security
      }),
      responses: {
        200: z.object({
          valid: z.boolean(),
          message: z.string(),
        }),
        403: errorSchemas.unauthorized, // Banned or Invalid
      },
    },
    // Helper to get the Lua script template
    generate: {
      method: 'GET' as const,
      path: '/api/script/lua' as const,
      responses: {
        200: z.object({ script: z.string() }),
      },
    }
  },

  // Admin Endpoints (Require ADMIN_TOKEN header)
  admin: {
    auth: {
      method: 'POST' as const,
      path: '/api/admin/auth' as const,
      input: z.object({ token: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    keys: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/keys' as const,
        responses: {
          200: z.array(z.custom<typeof keys.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/keys' as const,
        input: insertKeySchema,
        responses: {
          201: z.custom<typeof keys.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/keys/:id' as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
    blacklist: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/blacklist' as const,
        responses: {
          200: z.array(z.custom<typeof blacklist.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      add: {
        method: 'POST' as const,
        path: '/api/admin/blacklist' as const,
        input: insertBlacklistSchema,
        responses: {
          201: z.custom<typeof blacklist.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      remove: {
        method: 'DELETE' as const,
        path: '/api/admin/blacklist/:id' as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalKeys: z.number(),
          activeKeys: z.number(),
          totalValidations: z.number(),
          bannedUsers: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
