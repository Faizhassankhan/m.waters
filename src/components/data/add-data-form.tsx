
"use client";

import { useContext, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  date: z.string().min(1, "Date is required."),
  bottles: z.coerce.number().min(1, "At least one bottle is required."),
});

export function AddDataForm({ onSave, initialName }: { onSave: () => void, initialName?: string }) {
  const { addUserData } = useContext(AppContext);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || "",
      date: format(new Date(), "yyyy-MM-dd"),
      bottles: 1,
    },
  });

  useEffect(() => {
    // This effect runs when the initialName prop changes (e.g., a new user is selected)
    // It resets the form with the new initial values.
    form.reset({
      name: initialName || "",
      date: format(new Date(), "yyyy-MM-dd"),
      bottles: 1,
    });
  }, [initialName, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    addUserData(values);
    toast({
      title: "Success",
      description: `Data for ${values.name} has been saved.`,
    });
    // Reset form but keep the name if it was pre-filled
    form.reset({
        name: initialName || "",
        date: format(new Date(), "yyyy-MM-dd"),
        bottles: 1,
    });
    onSave();
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
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} readOnly={!!initialName} />
                  </FormControl>
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
        <Button type="submit">Save Data</Button>
      </form>
    </Form>
  );
}
