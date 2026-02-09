import { Sidebar } from "@/components/Sidebar";
import { useScript } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Copy, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Script() {
  const { data, isLoading } = useScript();
  const { toast } = useToast();

  const copyScript = () => {
    if (data?.script) {
      navigator.clipboard.writeText(data.script);
      toast({ title: "Copied", description: "Lua script copied to clipboard" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Lua Script</h1>
          <p className="text-muted-foreground mt-2">Distribution script for your users.</p>
        </header>

        <div className="bg-card border border-border rounded-xl shadow-lg animate-grid-fade">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <Terminal className="w-4 h-4" />
              loader.lua
            </div>
            <Button onClick={copyScript} className="bg-primary/20 text-primary hover:bg-primary/30">
              <Copy className="w-4 h-4 mr-2" />
              Copy Script
            </Button>
          </div>
          
          <div className="relative">
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Generating script template...
              </div>
            ) : (
              <ScrollArea className="h-[500px] w-full bg-[#0d1117] p-4 font-mono text-sm text-gray-300">
                <pre className="whitespace-pre-wrap selection:bg-primary/30">
                  {data?.script}
                </pre>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-lg mb-2">How it works</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This script connects to your API to validate keys. It sends the user's HWID automatically.
              If the key is valid, the server returns "valid = true" and you can proceed to execute your main logic.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-lg mb-2">Security Note</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Obfuscate this script before distributing it to users. The endpoint URL is visible in the source code.
              Ensure your main payload is only executed inside the success callback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
