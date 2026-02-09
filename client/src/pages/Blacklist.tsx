import { Sidebar } from "@/components/Sidebar";
import { BanUserDialog } from "@/components/BanUserDialog";
import { useBlacklist, useRemoveFromBlacklist } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Blacklist() {
  const { data: blacklist, isLoading } = useBlacklist();
  const unbanUser = useRemoveFromBlacklist();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-destructive">Blacklist</h1>
            <p className="text-muted-foreground mt-2">Manage banned HWIDs and IPs.</p>
          </div>
          <BanUserDialog />
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-grid-fade">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>HWID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : blacklist?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No banned users. Good news!
                  </TableCell>
                </TableRow>
              ) : (
                blacklist?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.hwid || "N/A"}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.ip || "N/A"}</TableCell>
                    <TableCell>{entry.reason}</TableCell>
                    <TableCell>
                      {format(new Date(entry.bannedAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-green-500/10 hover:text-green-500"
                        onClick={() => {
                          if (confirm("Revoke this ban?")) {
                            unbanUser.mutate(entry.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Unban</span>
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
