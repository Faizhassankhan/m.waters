
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
import { Invoice, UserData, Delivery } from "@/lib/types";
import { UserCheck, Loader2 } from "lucide-react";
import { format, subMonths, getYear, getMonth } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  paymentMethod: z.enum(["EasyPaisa", "JazzCash", "Bank Transfer"]),
  recipientNumber: z.string().regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (03xxxxxxxxx)."),
  month: z.string().min(1, "Month is required."),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

const DEFAULT_BOTTLE_PRICE = 150;

const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(i);
    return format(d, "MMMM");
});


export function InvoiceForm({ onInvoiceCreated }: { onInvoiceCreated: (invoice: Invoice) => void }) {
  const { addInvoice, users } = useContext(AppContext);
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(subMonths(new Date(), 1), 'MMMM'));
  const [deliveriesForInvoice, setDeliveriesForInvoice] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      paymentMethod: "EasyPaisa",
      recipientNumber: "",
      month: selectedMonth,
    },
  });
  
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name) {
        const foundUser = users.find(u => u.name.toLowerCase() === value.name?.toLowerCase());
        setSelectedUser(foundUser || null);
      }
      if (name === 'month' && value.month) {
        setSelectedMonth(value.month);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, users]);

  useEffect(() => {
    if (selectedUser && selectedMonth) {
        const monthIndex = months.indexOf(selectedMonth);
        const currentYear = getYear(new Date());

        const userDeliveries = selectedUser.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return getMonth(deliveryDate) === monthIndex && getYear(deliveryDate) === currentYear;
        });

        setDeliveriesForInvoice(userDeliveries);

        const totalBottles = userDeliveries.reduce((sum, d) => sum + d.bottles, 0);
        const bottlePrice = selectedUser.bottlePrice || DEFAULT_BOTTLE_PRICE;
        const totalAmount = totalBottles * bottlePrice;
        form.setValue("amount", totalAmount, { shouldValidate: true });
    } else {
        setDeliveriesForInvoice([]);
        if (!form.formState.dirtyFields.amount) {
          form.setValue("amount", 0);
        }
    }
  }, [selectedUser, selectedMonth, form]);

  async function onSubmit(values: InvoiceFormValues) {
    setLoading(true);
    try {
        const newInvoice = await addInvoice({ ...values, deliveries: deliveriesForInvoice });
        if (newInvoice) {
            onInvoiceCreated(newInvoice);
            toast({
                title: "Invoice Created",
                description: `Invoice for ${values.name} has been generated.`,
            });
            form.reset({
                name: "",
                amount: 0,
                paymentMethod: "EasyPaisa",
                recipientNumber: "",
                month: format(subMonths(new Date(), 1), 'MMMM'),
            });
            setSelectedUser(null);
            setDeliveriesForInvoice([]);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: `Could not create invoice. Ensure user exists.`,
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Creating Invoice",
            description: error.message || "An unexpected error occurred."
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
        
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Month</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (PKR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} readOnly={deliveriesForInvoice.length > 0} />
              </FormControl>
              {deliveriesForInvoice.length > 0 && <FormDescription>Amount auto-calculated from deliveries ({selectedUser?.bottlePrice || DEFAULT_BOTTLE_PRICE} PKR/bottle).</FormDescription>}
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
