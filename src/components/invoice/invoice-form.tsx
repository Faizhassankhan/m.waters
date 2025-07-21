
"use client";

import { useContext, useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Invoice, UserProfile, Delivery } from "@/lib/types";
import { UserCheck, Loader2 } from "lucide-react";
import { format, subMonths, getYear, getMonth } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  previousBalance: z.coerce.number().optional(),
  paymentMethod: z.enum(["EasyPaisa", "JazzCash", "Bank Transfer"]),
  recipientNumber: z.string().regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (03xxxxxxxxx)."),
  month: z.string().min(1, "Month is required."),
  year: z.coerce.number(),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

const DEFAULT_BOTTLE_PRICE = 100;

const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), "MMMM"));
const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

const previousMonth = format(subMonths(new Date(), 1), 'MMMM');
const previousMonthYear = getYear(subMonths(new Date(), 1));


export function InvoiceForm({ onInvoiceCreated }: { onInvoiceCreated: (invoice: Invoice) => void }) {
  const { addInvoice, userProfiles } = useContext(AppContext);
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      previousBalance: 0,
      paymentMethod: "EasyPaisa",
      recipientNumber: "",
      month: previousMonth,
      year: previousMonthYear,
    },
  });
  
  const selectedName = form.watch("name");
  const selectedMonth = form.watch("month");
  const selectedYear = form.watch("year");

  useEffect(() => {
    if (selectedName) {
      const foundUser = userProfiles.find(u => u.name.toLowerCase() === selectedName.toLowerCase());
      setSelectedUser(foundUser || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedName, userProfiles]);

  useEffect(() => {
    if (selectedUser) {
        const monthIndex = months.indexOf(selectedMonth);
        
        const userDeliveries = selectedUser.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return getMonth(deliveryDate) === monthIndex && getYear(deliveryDate) === selectedYear;
        });

        const totalBottles = userDeliveries.reduce((sum, d) => sum + d.bottles, 0);
        const bottlePrice = selectedUser.bottlePrice || DEFAULT_BOTTLE_PRICE;
        const totalAmount = totalBottles * bottlePrice;
        form.setValue("amount", totalAmount, { shouldValidate: true });
    } else {
        if (!form.formState.dirtyFields.amount) {
          form.setValue("amount", 0);
        }
    }
  }, [selectedUser, selectedMonth, selectedYear, form]);

  async function onSubmit(values: InvoiceFormValues) {
    setLoading(true);
    try {
        const invoicePayload = {
            ...values,
            name: values.name,
            previousBalance: values.previousBalance || 0,
        };

        const newInvoice = await addInvoice(invoicePayload);
        if (newInvoice) {
            onInvoiceCreated(newInvoice);
            toast({
                title: "Invoice Created",
                description: `Invoice for ${values.name} has been generated.`,
            });
            form.reset({
                name: "",
                amount: 0,
                previousBalance: 0,
                paymentMethod: "EasyPaisa",
                recipientNumber: "",
                month: previousMonth,
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
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
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
