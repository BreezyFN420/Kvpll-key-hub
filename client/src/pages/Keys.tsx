import { Sidebar } from "@/components/Sidebar";
import { CreateKeyDialog } from "@/components/CreateKeyDialog";
import { useKeys, useDeleteKey } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function Keys() {
  const { data: keys, isLoading } = useKeys();
  const deleteKey = useDeleteKey();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Key copied to clipboard" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">License Keys</h1>
            <p className="text-muted-foreground mt-2">Manage access keys for your script.</p>
          </div>
          <CreateKeyDialog />
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-grid-fade">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Key</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : keys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No keys found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                keys?.map((key) => (
                  <TableRow key={key.id} className="group">
                    <TableCell className="font-mono font-medium flex items-center gap-2">
                      <span className="text-primary">{key.key}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{key.note || "-"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        key.uses >= key.maxUses ? "text-destructive" : "text-foreground"
                      )}>
                        {key.uses} / {key.maxUses}
                      </span>
                    </TableCell>
                    <TableCell>
                      {key.expiresAt ? format(new Date(key.expiresAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      {key.isRevoked ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this key?")) {
                            deleteKey.mutate(key.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
