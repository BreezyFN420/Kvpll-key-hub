import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Lock } from "lucide-react";

export default function Login() {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(api.admin.auth.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput }),
      });

      if (res.ok) {
        setToken(tokenInput);
        setLocation("/dashboard");
        toast({ title: "Access Granted", description: "Welcome back, Admin." });
      } else {
        toast({ 
          title: "Access Denied", 
          description: "Invalid security token.", 
          variant: "destructive" 
        });
      }
    } catch (err) {
      toast({ 
        title: "Connection Error", 
        description: "Could not reach authentication server.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Matrix Effect (Simplified) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-grid-fade">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.5)]">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">NEXUS_ADMIN</h1>
            <p className="text-muted-foreground text-sm mt-2">Secure Gateway Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter Security Token"
                  className="pl-9 bg-background/50 border-input font-mono"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Establish Connection"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Protected System. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
