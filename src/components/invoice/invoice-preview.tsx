
"use client";

import { useRef, useState } from "react";
import * as htmlToImage from 'html-to-image';
import { Invoice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Droplets, Share2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";


interface InvoicePreviewProps {
  invoice: Invoice | null;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!invoiceRef.current || !invoice) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(invoiceRef.current, { 
        quality: 0.95,
        // The background of the parent div will be the image background
        backgroundColor: 'hsl(var(--background))', 
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `invoice-${invoice.id}.png`, { type: blob.type });

      const shareData = {
        files: [file],
        title: `Invoice for ${invoice.name}`,
        text: `Here is the invoice for ${invoice.name} for the month of ${invoice.month}.`,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support sharing files
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `invoice-${invoice.id}.png`;
        link.click();
        toast({
          title: "Image downloaded",
          description: "Your browser doesn't support direct sharing. The invoice image has been downloaded for you to share manually.",
        });
      }

    } catch (error) {
      console.error('oops, something went wrong!', error);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not generate invoice image. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
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

  const totalBottles = invoice.deliveries?.reduce((sum, d) => sum + d.bottles, 0) || 0;

  return (
    <div className="flex flex-col h-full">
      {/* This div is what will be converted to an image */}
      <div ref={invoiceRef} className="bg-background p-4 flex-grow">
        <Card className="shadow-2xl animate-in fade-in-50 bg-white text-card-foreground">
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
                <p className="text-sm text-muted-foreground">INVOICE FOR</p>
                <p className="font-semibold">{invoice.month}</p>
              </div>
            </div>
            
            {invoice.deliveries && invoice.deliveries.length > 0 && (
                <>
                    <p className="text-sm text-muted-foreground mb-2">DELIVERY DETAILS</p>
                    <div className="rounded-md border">
                        <ScrollArea className="h-[150px] w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Bottles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.deliveries.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{format(new Date(d.date), 'MMMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right font-medium">{d.bottles}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="flex justify-end items-center p-2 bg-muted/50 font-bold text-sm">
                            Total Bottles: {totalBottles}
                        </div>
                    </div>
                </>
            )}
            
            <Separator className="my-6" />

            <div className="grid gap-4">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium">{invoice.paymentMethod}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Recipient Number</span>
                    <span className="font-medium">{invoice.recipientNumber}</span>
                </div>
            </div>
            
            <Separator className="my-6" />

            <div className="flex justify-end items-center text-right">
                <div>
                    <p className="text-sm text-muted-foreground">TOTAL AMOUNT</p>
                    <p className="font-bold text-3xl font-headline text-primary">PKR {invoice.amount.toLocaleString()}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
       {/* The footer and button are now outside the captured ref */}
      <CardFooter className="p-6 pt-4 bg-background rounded-b-lg">
          <Button onClick={handleShare} className="w-full" disabled={isSharing}>
              {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
              {isSharing ? 'Generating Image...' : 'Share Invoice as Image'}
          </Button>
      </CardFooter>
    </div>
  );
}
