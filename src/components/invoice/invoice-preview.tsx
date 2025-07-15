"use client";

import { Invoice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Droplets, Share2 } from "lucide-react";
import { format } from "date-fns";

interface InvoicePreviewProps {
  invoice: Invoice | null;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  
  const getPaymentLink = (invoice: Invoice): string => {
    // NOTE: These are hypothetical deep links. Real-world usage requires knowledge
    // of the specific payment app's URL scheme.
    const amount = invoice.amount;
    const number = invoice.recipientNumber;
    switch(invoice.paymentMethod) {
        case "EasyPaisa":
            return `https://easypaisa.com.pk/p2p?receiver=${number}&amount=${amount}`; // Placeholder URL
        case "JazzCash":
            return `https://jazzcash.com.pk/send-money?receiver=${number}&amount=${amount}`; // Placeholder URL
        default:
            return `our bank details.`;
    }
  }

  const handleShare = () => {
    if (!invoice) return;

    const paymentLink = getPaymentLink(invoice);
    const message = `Hello ${invoice.name},\n\nHere is your invoice from M.Waters for PKR ${invoice.amount}.\n\nPlease use the following link to pay via ${invoice.paymentMethod}:\n${paymentLink}\n\nThank you!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!invoice) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <div className="text-center text-muted-foreground">
          <p className="font-headline text-lg">Invoice Preview</p>
          <p>Your generated invoice will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg animate-in fade-in-50">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Droplets className="h-8 w-8" />
                <CardTitle className="font-headline text-3xl">M.Waters</CardTitle>
            </div>
            <div className="text-right">
                <p className="font-semibold">INVOICE</p>
                <p className="text-sm text-primary-foreground/80">{invoice.id}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">BILLED TO</p>
            <p className="font-semibold">{invoice.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">DATE</p>
            <p className="font-semibold">{format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
        
        <Separator className="my-4" />

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{invoice.paymentMethod}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Recipient Number</span>
                <span className="font-medium">{invoice.recipientNumber}</span>
            </div>
        </div>
        
        <Separator className="my-4" />

        <div className="flex justify-end items-center text-right">
            <div>
                <p className="text-sm text-muted-foreground">TOTAL AMOUNT</p>
                <p className="font-bold text-3xl font-headline text-primary">PKR {invoice.amount.toLocaleString()}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-muted/50 rounded-b-lg">
        <Button onClick={handleShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4"/>
            Share Invoice
        </Button>
      </CardFooter>
    </Card>
  );
}
