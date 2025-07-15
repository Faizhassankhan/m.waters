"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Invoice } from "@/lib/types";
import { aiAssistInput, AiAssistInputOutput } from "@/ai/flows/ai-assisted-input";
import { Loader2, Sparkles } from "lucide-react";
import debounce from "lodash.debounce";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  paymentMethod: z.enum(["EasyPaisa", "JazzCash", "Bank Transfer"]),
  recipientNumber: z.string().regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (03xxxxxxxxx)."),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

export function InvoiceForm({ onInvoiceCreated }: { onInvoiceCreated: (invoice: Invoice) => void }) {
  const { addInvoice, invoices } = useContext(AppContext);
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<AiAssistInputOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      paymentMethod: "EasyPaisa",
      recipientNumber: "",
    },
  });

  const getAiSuggestions = useCallback(
    debounce(async (name: string) => {
        if (name.length < 3) {
            setAiSuggestions(null);
            return;
        }
        setIsAiLoading(true);
        try {
            const previousEntries = invoices
                .filter(inv => inv.name.toLowerCase().includes(name.toLowerCase()))
                .map(inv => ({
                    name: inv.name,
                    paymentType: inv.paymentMethod,
                    currencyAmount: inv.amount
                }));

            const suggestions = await aiAssistInput({ inputText: name, previousEntries });
            setAiSuggestions(suggestions);

            if (suggestions.correctedText && suggestions.correctedText.toLowerCase() !== name.toLowerCase()) {
                form.setValue("name", suggestions.correctedText, { shouldValidate: true });
                toast({ title: "AI Correction", description: `Name corrected to "${suggestions.correctedText}"` });
            }

        } catch (error) {
            console.error("AI suggestion failed:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not fetch AI suggestions." });
        } finally {
            setIsAiLoading(false);
        }
    }, 500), [invoices, form.setValue, toast]
  );
  
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name) {
        getAiSuggestions(value.name);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, getAiSuggestions]);

  const applySuggestion = (suggestion: Partial<InvoiceFormValues>) => {
    if(suggestion.name) form.setValue("name", suggestion.name);
    if(suggestion.amount) form.setValue("amount", suggestion.amount);
    if(suggestion.paymentMethod) form.setValue("paymentMethod", suggestion.paymentMethod);
    setAiSuggestions(null);
  };

  function onSubmit(values: InvoiceFormValues) {
    const newInvoice = addInvoice(values);
    onInvoiceCreated(newInvoice);
    toast({
      title: "Invoice Created",
      description: `Invoice for ${values.name} has been generated.`,
    });
    form.reset();
    setAiSuggestions(null);
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
                {isAiLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {aiSuggestions && (
          <Card className="bg-accent/50 p-3">
             <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-4 w-4 mt-1 text-primary shrink-0"/>
                <p className="text-sm font-medium text-primary-foreground">AI Suggestions</p>
             </div>
             <div className="flex flex-wrap gap-2">
             {aiSuggestions.suggestedName && (
                <Button variant="outline" size="sm" type="button" onClick={() => applySuggestion({ name: aiSuggestions.suggestedName })}>
                    Use name: {aiSuggestions.suggestedName}
                </Button>
            )}
            {aiSuggestions.suggestedPaymentType && (
                <Button variant="outline" size="sm" type="button" onClick={() => applySuggestion({ paymentMethod: aiSuggestions.suggestedPaymentType as any })}>
                    Pay with: {aiSuggestions.suggestedPaymentType}
                </Button>
            )}
            {aiSuggestions.suggestedCurrencyAmount && (
                <Button variant="outline" size="sm" type="button" onClick={() => applySuggestion({ amount: aiSuggestions.suggestedCurrencyAmount })}>
                    Amount: {aiSuggestions.suggestedCurrencyAmount} PKR
                </Button>
            )}
            </div>
          </Card>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (PKR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} />
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
        <Button type="submit" className="w-full">Create Invoice</Button>
      </form>
    </Form>
  );
}
