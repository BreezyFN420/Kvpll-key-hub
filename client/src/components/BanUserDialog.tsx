import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBlacklistSchema } from "@shared/schema";
import { useAddToBlacklist } from "@/hooks/use-admin";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldBan } from "lucide-react";

const formSchema = insertBlacklistSchema.extend({
  hwid: z.string().min(1, "HWID is required"),
  reason: z.string().min(1, "Reason is required"),
});

export function BanUserDialog() {
  const [open, setOpen] = useState(false);
  const banUser = useAddToBlacklist();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hwid: "",
      ip: "",
      reason: "Violation of TOS",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    banUser.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]">
          <ShieldBan className="w-4 h-4 mr-2" />
          Ban User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
            <ShieldBan className="w-5 h-5" />
            Ban Hardware ID
          </DialogTitle>
          <DialogDescription>
            Prevent a specific HWID from accessing the script permanently.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="hwid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target HWID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="HWID-..." className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="192.168.x.x" className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ban Reason</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Sharing key" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="destructive" disabled={banUser.isPending}>
                {banUser.isPending ? "Banning..." : "Execute Ban"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
