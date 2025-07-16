
"use client";

import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/contexts/app-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { AddUserDataPayload } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "Please select a user."),
  date: z.string().min(1, "Date is required."),
  bottles: z.coerce.number().min(1, "At least one bottle is required."),
});

export function AddDataForm({ onSave, initialName }: { onSave: () => void, initialName?: string }) {
  const { addUserData, users } = useContext(AppContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || "",
      date: format(new Date(), "yyyy-MM-dd"),
      bottles: 1,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialName || "",
      date: format(new Date(), "yyyy-MM-dd"),
      bottles: 1,
    });
  }, [initialName, form]);

  async function onSubmit(values: AddUserDataPayload) {
    setLoading(true);
    try {
      await addUserData(values);
      toast({
        title: "Success",
        description: `Data for ${values.name} has been saved.`,
      });
      form.reset({
          name: initialName || "",
          date: format(new Date(), "yyyy-MM-dd"),
          bottles: 1,
      });
      onSave();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Saving Data",
            description: error.message || "An unexpected error occurred."
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialName}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bottles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bottles</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Data
        </Button>
      </form>
    </Form>
  );
}
