import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertKeySchema, type InsertKey } from "@shared/schema";
import { useCreateKey } from "@/hooks/use-admin";
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
import { Plus } from "lucide-react";

const formSchema = insertKeySchema.extend({
  key: z.string().min(1, "Key is required"),
  maxUses: z.coerce.number().min(1),
  durationDays: z.coerce.number().optional(),
});

export function CreateKeyDialog() {
  const [open, setOpen] = useState(false);
  const createKey = useCreateKey();

  // Generate a random key for convenience
  const generateRandomKey = () => {
    return "NEXUS-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: generateRandomKey(),
      note: "",
      maxUses: 1,
      durationDays: 30,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createKey.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset({
          key: generateRandomKey(),
          note: "",
          maxUses: 1,
          durationDays: 30,
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)] transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Generate Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create License Key</DialogTitle>
          <DialogDescription>
            Generate a new access key for the Lua script.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Key</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input {...field} className="font-mono" />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => form.setValue("key", generateRandomKey())}
                        title="Regenerate"
                      >
                        <span className="text-xs">↻</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Uses</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="Permanent if empty" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. For Discord User #1234" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createKey.isPending}>
                {createKey.isPending ? "Generating..." : "Create Key"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
