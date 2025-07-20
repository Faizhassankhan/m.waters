
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { AddUserDataPayload } from "@/lib/types";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  name: z.string().min(1, "Please select a data profile."),
  date: z.string().min(1, "Date is required."),
  bottles: z.coerce.number().min(1, "At least one bottle is required."),
});

export function AddDataForm({ initialName }: { initialName?: string }) {
  const { addUserData, userProfiles } = useContext(AppContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || "",
      date: format(new Date(), "yyyy-MM-dd"),
      bottles: 1,
    },
  });

  useEffect(() => {
    if (initialName) {
        form.setValue("name", initialName);
    }
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

  const sortedUserProfiles = userProfiles.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Profile Name</FormLabel>
                   <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!!initialName}
                          >
                            {field.value
                              ? sortedUserProfiles.find(
                                  (profile) => profile.name === field.value
                                )?.name
                              : "Select a data profile"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search profile..." />
                           <CommandList>
                            <CommandEmpty>No profile found.</CommandEmpty>
                            <CommandGroup>
                              {sortedUserProfiles.map((profile) => (
                                <CommandItem
                                  value={profile.name}
                                  key={profile.id}
                                  onSelect={() => {
                                    form.setValue("name", profile.name);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      profile.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {profile.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
