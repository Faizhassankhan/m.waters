
"use client";

import { useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { Invoice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share2, Loader2, FileText, ImageIcon, FileImage } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoicePreviewProps {
  invoice: Invoice | null;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  
  const getSafeDate = (dateString: string | undefined) => {
    if (!dateString) return new Date();
    const date = parseISO(dateString);
    return isValid(date) ? date : new Date();
  }

  const shareFile = async (file: File, title: string, text: string) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
    } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
        toast({
            title: "File Downloaded",
            description: "Your browser doesn't support direct sharing. The file has been downloaded."
        });
    }
  };

  const handleShareStyledPdf = async () => {
    if (!invoiceRef.current || !invoice) return;

    setIsSharing(true);
    try {
        const dataUrl = await htmlToImage.toPng(invoiceRef.current, { 
            quality: 1, 
            pixelRatio: 2, // Increase pixel ratio for better quality
            backgroundColor: 'hsl(var(--background))' 
        });

        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [img.width, img.height]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
            
            const pdfBlob = pdf.output('blob');
            const fileName = `invoice-styled-${invoice.id}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            await shareFile(file, `Invoice for ${invoice.name}`, `Here is the styled invoice for ${invoice.name}.`);
            setIsSharing(false);
        };
    } catch (error) {
        console.error('Styled PDF generation failed', error);
        toast({ variant: "destructive", title: "PDF Failed", description: "Could not generate styled PDF." });
        setIsSharing(false);
    }
  };


  const handleSharePdf = async () => {
    if (!invoice) return;

    setIsSharing(true);
    try {
      const doc = new jsPDF();

      // Add Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("m.waters", 14, 22);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("FIT TO LIVE", 16, 28);
      
      doc.setFontSize(16);
      doc.text("BILL / INVOICE", 205, 22, { align: "right" });
      doc.setFontSize(10);
      doc.text(invoice.id, 205, 28, { align: "right" });

      // Add Billed to and Date section
      doc.setLineWidth(0.5);
      doc.line(14, 35, 205, 35);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("BILLED TO", 14, 42);
      doc.text("DATE", 205, 42, { align: "right" });

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.name, 14, 48);
      doc.setFont("helvetica", "normal");
      doc.text(format(getSafeDate(invoice.createdAt), "MMMM dd, yyyy"), 205, 48, { align: "right" });
      
      doc.line(14, 55, 205, 55);

      // Add Delivery Details Table
      if (sortedDeliveries.length > 0) {
        autoTable(doc, {
          startY: 62,
          head: [['Date', 'Bottles']],
          body: sortedDeliveries.map(d => [format(new Date(d.date), 'MMMM dd, yyyy'), d.bottles]),
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
          didDrawPage: (data) => {
            // Footer for table
            const tableBottom = data.cursor?.y ?? 0;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Total Bottles: ${totalBottles}`, 14, tableBottom + 10);
            doc.text(`Rate: ${invoice.bottlePrice || '100'} PKR`, 205, tableBottom + 10, { align: "right" });
          }
        });
      }

      const finalY = (doc as any).lastAutoTable.finalY || 80;

      // Payment Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details", 14, finalY + 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Method: ${invoice.paymentMethod}`, 14, finalY + 27);
      doc.text(`Account / Number: ${invoice.recipientNumber}`, 14, finalY + 34);


      // Summary
      const summaryX = 150;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Current Bill:", summaryX, finalY + 20, {align: "right"});
      doc.text(`PKR ${currentMonthBill.toLocaleString()}`, 205, finalY + 20, { align: "right" });
      
      doc.text("Previous Balance:", summaryX, finalY + 27, {align: "right"});
      doc.text(`PKR ${previousBalance.toLocaleString()}`, 205, finalY + 27, { align: "right" });
      
      doc.setLineWidth(0.2);
      doc.line(summaryX - 10, finalY + 31, 205, finalY + 31);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total:", summaryX, finalY + 38, {align: "right"});
      doc.setFontSize(18);
      doc.text(`PKR ${grandTotal.toLocaleString()}`, 205, finalY + 38, { align: "right" });

      const pdfBlob = doc.output('blob');
      const fileName = `invoice-${invoice.id}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      await shareFile(file, `Invoice for ${invoice.name}`, `Here is the invoice for ${invoice.name} for the month of ${invoice.month}.`);

    } catch (error) {
      console.error('oops, something went wrong!', error);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not generate invoice PDF. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareImage = async () => {
    if (!invoiceRef.current || !invoice) return;

    setIsSharing(true);
    try {
        const dataUrl = await htmlToImage.toPng(invoiceRef.current, { quality: 0.95, backgroundColor: 'hsl(var(--background))' });
        
        const blob = await (await fetch(dataUrl)).blob();
        const fileName = `invoice-${invoice.id}.png`;
        const file = new File([blob], fileName, { type: blob.type });

        await shareFile(file, `Invoice for ${invoice.name}`, `Here is the invoice for ${invoice.name}.`);

    } catch (error) {
        console.error('Oops, something went wrong!', error);
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

  const sortedDeliveries = invoice.deliveries 
    ? [...invoice.deliveries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const totalBottles = sortedDeliveries.reduce((sum, d) => sum + d.bottles, 0);
    
  const currentMonthBill = invoice.amount;
  const previousBalance = invoice.previousBalance || 0;
  const grandTotal = currentMonthBill + previousBalance;


  return (
    <div className="flex flex-col h-full">
      <div ref={invoiceRef} className="bg-background p-4 flex-grow">
        <Card style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)' }} className="animate-in fade-in-50 bg-white text-card-foreground">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CardTitle className="font-headline text-3xl flex items-baseline">
                       <svg width="150" height="70" viewBox="0 0 170 80" className="-ml-4">
                            <circle cx="40" cy="40" r="35" fill="#ECF0F1" stroke="#34495E" strokeWidth="2" />
                            <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="#34495E" textAnchor="middle" dominantBaseline="central">m</text>
                            <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="#ECF0F1"/>
                            <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="30" fill="#ECF0F1" dy=".3em">waters</text>
                            <text x="115" y="68" fontFamily="sans-serif" fontSize="10" fill="#ECF0F1" dy=".3em">FIT TO LIVE</text>
                        </svg>
                    </CardTitle>
                </div>
                <div className="text-right">
                    <p className="font-semibold">BILL</p>
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
                <p className="font-semibold">{format(getSafeDate(invoice.createdAt), "MMMM dd, yyyy")}</p>
              </div>
            </div>
            
            {sortedDeliveries.length > 0 ? (
                <>
                    <p className="text-sm text-muted-foreground mb-2">DELIVERY DETAILS FOR {invoice.month.toUpperCase()}</p>
                    <div className="rounded-md border">
                        <div className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Bottles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedDeliveries.map((d, index) => (
                                        <TableRow key={d.id || index}>
                                            <TableCell>{format(new Date(d.date), 'MMMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right font-medium">{d.bottles}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted/50 font-bold text-sm">
                            <span>Total Bottles: {totalBottles}</span>
                            <span>Rate: {invoice.bottlePrice || '100'} PKR</span>
                        </div>
                    </div>
                </>
            ) : (
                 <div className="text-center text-muted-foreground py-8">
                    No delivery details found for this month.
                </div>
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

            <div className="flex justify-end items-start text-right">
                <div className="grid gap-2 w-full max-w-xs">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Bill</span>
                        <span className="font-medium">PKR {currentMonthBill.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Previous Balance</span>
                        <span className="font-medium">PKR {previousBalance.toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-lg">Grand Total</p>
                        <p className="font-bold text-3xl font-headline text-primary">PKR {grandTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
       <CardFooter className="p-6 pt-4 bg-background rounded-b-lg">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full" disabled={isSharing}>
                  {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
                  {isSharing ? 'Generating...' : 'Share Bill'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={handleSharePdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Share as Standard PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareStyledPdf}>
                  <FileImage className="mr-2 h-4 w-4" />
                  <span>Share as Styled PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareImage}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Share as Image</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
      </CardFooter>
    </div>
  );
}
