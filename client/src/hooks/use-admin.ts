import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertKey, type InsertBlacklist } from "@shared/routes";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

// Helper to add auth header
function getHeaders(token: string | null) {
  return {
    "Content-Type": "application/json",
    "x-admin-token": token || "",
  };
}

// === KEYS ===

export function useKeys() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [api.admin.keys.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.keys.list.path, {
        headers: getHeaders(token),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch keys");
      return api.admin.keys.list.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useCreateKey() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertKey) => {
      const validated = api.admin.keys.create.input.parse(data);
      const res = await fetch(api.admin.keys.create.path, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message || "Validation failed");
        }
        throw new Error("Failed to create key");
      }
      return api.admin.keys.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.keys.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      toast({ title: "Success", description: "Key generated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteKey() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.keys.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(token),
      });
      
      if (!res.ok) throw new Error("Failed to delete key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.keys.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      toast({ title: "Success", description: "Key deleted" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

// === BLACKLIST ===

export function useBlacklist() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [api.admin.blacklist.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.blacklist.list.path, {
        headers: getHeaders(token),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch blacklist");
      return api.admin.blacklist.list.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useAddToBlacklist() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBlacklist) => {
      const validated = api.admin.blacklist.add.input.parse(data);
      const res = await fetch(api.admin.blacklist.add.path, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Failed to blacklist user");
      return api.admin.blacklist.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.blacklist.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      toast({ title: "Banned", description: "User has been blacklisted" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveFromBlacklist() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.blacklist.remove.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(token),
      });
      
      if (!res.ok) throw new Error("Failed to remove ban");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.blacklist.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      toast({ title: "Unbanned", description: "Ban removed successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

// === STATS ===

export function useStats() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path, {
        headers: getHeaders(token),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.admin.stats.responses[200].parse(await res.json());
    },
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30s
  });
}

// === SCRIPT ===

export function useScript() {
  return useQuery({
    queryKey: [api.script.generate.path],
    queryFn: async () => {
      const res = await fetch(api.script.generate.path);
      if (!res.ok) throw new Error("Failed to fetch script");
      return api.script.generate.responses[200].parse(await res.json());
    },
  });
}
