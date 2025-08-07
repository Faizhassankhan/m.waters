
"use client";

import { useContext, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/contexts/app-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Invoice, UserProfile, Delivery, BillingRecord } from "@/lib/types";
import { UserCheck, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { format, subMonths, getYear, getMonth } from 'date-fns';
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  userId: z.string().nullable(), // Can be null for non-profile users
  amount: z.coerce.number().positive("Amount must be positive."),
  bottlePrice: z.coerce.number().optional(),
  previousBalance: z.coerce.number().optional(),
  advance: z.coerce.number().optional(),
  paymentMethod: z.enum(["EasyPaisa", "JazzCash", "Bank Transfer"]),
  recipientNumber: z.string().regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (03xxxxxxxxx)."),
  month: z.string().min(1, "Month is required."),
  year: z.coerce.number(),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

const DEFAULT_BOTTLE_PRICE = 100;

const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), "MMMM"));
const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

const previousMonthDate = subMonths(new Date(), 1);
const previousMonthName = format(previousMonthDate, 'MMMM');
const previousMonthYear = getYear(previousMonthDate);


export function InvoiceForm({ onInvoiceCreated }: { onInvoiceCreated: (invoice: Invoice) => void }) {
  const { addInvoice, userProfiles } = useContext(AppContext);
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      userId: null,
      amount: 0,
      bottlePrice: DEFAULT_BOTTLE_PRICE,
      previousBalance: 0,
      advance: 0,
      paymentMethod: "EasyPaisa",
      recipientNumber: "",
      month: previousMonthName,
      year: previousMonthYear,
    },
  });
  
  const selectedName = form.watch("name");
  const selectedMonth = form.watch("month");
  const selectedYear = form.watch("year");

  const deliveriesForInvoice = useMemo(() => {
    if (!selectedUser) return [];
    const monthIndex = months.indexOf(selectedMonth);
    return selectedUser.deliveries.filter(d => {
        const deliveryDate = new Date(d.date);
        return getMonth(deliveryDate) === monthIndex && getYear(deliveryDate) === selectedYear;
    });
  }, [selectedUser, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedName) {
      const foundUser = userProfiles.find(u => u.name.toLowerCase() === selectedName.toLowerCase());
      if (foundUser) {
        setSelectedUser(foundUser);
        form.setValue("userId", foundUser.id);
        form.setValue("bottlePrice", foundUser.bottlePrice || DEFAULT_BOTTLE_PRICE);
        
        // Auto-populate balance/advance from previous month
        const prevMonthRecord = foundUser.last_billing_record;
        if (prevMonthRecord) {
            const balance = prevMonthRecord.total_bill - prevMonthRecord.amount_paid;
            if (balance > 0) { // Outstanding balance
                form.setValue("previousBalance", balance);
                form.setValue("advance", 0);
            } else { // Advance payment
                form.setValue("previousBalance", 0);
                form.setValue("advance", Math.abs(balance));
            }
        } else {
            form.setValue("previousBalance", 0);
            form.setValue("advance", 0);
        }

      } else {
        setSelectedUser(null);
        form.setValue("userId", null);
        form.setValue("bottlePrice", DEFAULT_BOTTLE_PRICE);
        form.setValue("previousBalance", 0);
        form.setValue("advance", 0);
      }
    } else {
      setSelectedUser(null);
      form.setValue("userId", null);
      form.setValue("bottlePrice", DEFAULT_BOTTLE_PRICE);
    }
  }, [selectedName, userProfiles, form]);

  useEffect(() => {
    if (selectedUser) {
        const totalBottles = deliveriesForInvoice.reduce((sum, d) => sum + d.bottles, 0);
        const bottlePrice = selectedUser.bottlePrice || DEFAULT_BOTTLE_PRICE;
        const totalAmount = totalBottles * bottlePrice;
        form.setValue("amount", totalAmount, { shouldValidate: true });
    } else {
        // Only reset amount if user didn't change it manually for a non-profile user
        if (!form.formState.dirtyFields.amount) {
          form.setValue("amount", 0);
        }
    }
  }, [selectedUser, deliveriesForInvoice, form]);

  async function onSubmit(values: InvoiceFormValues) {
    setLoading(true);
    try {
        const newInvoice = await addInvoice(values, deliveriesForInvoice);
        if (newInvoice) {
            onInvoiceCreated(newInvoice);
            toast({
                title: "Invoice Created",
                description: `Invoice for ${values.name} has been generated.`,
            });
            form.reset({
                name: "",
                userId: null,
                amount: 0,
                bottlePrice: DEFAULT_BOTTLE_PRICE,
                previousBalance: 0,
                advance: 0,
                paymentMethod: "EasyPaisa",
                recipientNumber: "",
                month: previousMonthName,
                year: previousMonthYear,
            });
            setSelectedUser(null);
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Creating Invoice",
            description: `Failed to create invoice: ${error.message}`
        });
    } finally {
        setLoading(false);
    }
  }

  const sortedUserProfiles = [...userProfiles].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Recipient Name
                <div className="flex items-center gap-2">
                    {selectedUser && <UserCheck className="h-4 w-4 text-green-500" title="User data found" />}
                </div>
              </FormLabel>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? sortedUserProfiles.find(
                              (profile) => profile.name === field.value
                            )?.name
                          : "Select or type a name..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type name..." 
                        onValueChange={(search) => {
                            if (!sortedUserProfiles.some(p => p.name.toLowerCase() === search.toLowerCase())) {
                                field.onChange(search);
                            }
                        }}
                      />
                       <CommandList>
                        <CommandEmpty>
                            <div className="p-4 text-sm">
                                No profile found.
                                <p className="text-xs text-muted-foreground">You can continue typing to create an invoice for a new name.</p>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {sortedUserProfiles.map((profile) => (
                            <CommandItem
                              value={profile.name}
                              key={profile.id}
                              onSelect={() => {
                                form.setValue("name", profile.name);
                                setOpenCombobox(false);
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
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Month</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Year</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (PKR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} readOnly={!!selectedUser} />
              </FormControl>
              {selectedUser && <FormDescription>Amount auto-calculated from deliveries ({selectedUser?.bottlePrice || DEFAULT_BOTTLE_PRICE} PKR/bottle).</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Month Remaining PKR</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 500" {...field} value={field.value || 0} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="advance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Advance (PKR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 200" {...field} value={field.value || 0} />
              </FormControl>
              <FormDescription>Any advance payment to be deducted from the total bill.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                  <SelectItem value="JazzCash">JazzCash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipientNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Number</FormLabel>
              <FormControl>
                <Input placeholder="03xxxxxxxxx" {...field} />
              </FormControl>
              <FormDescription>Used for payment apps like EasyPaisa/JazzCash.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
        </Button>
      </form>
    </Form>
  );
}
