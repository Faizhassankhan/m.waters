
"use client";

import { useState, useContext } from "react";
import { AppContext } from "@/contexts/app-provider";
import { Invoice } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import { ViewInvoiceModal } from "./view-invoice-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const { deleteInvoice } = useContext(AppContext);
    const { toast } = useToast();

    const handleDelete = async () => {
        if (invoiceToDelete) {
            try {
                await deleteInvoice(invoiceToDelete.id);
                toast({
                    title: "Invoice Deleted",
                    description: `Invoice for ${invoiceToDelete.name} has been deleted.`,
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: error.message || "Could not delete invoice.",
                });
            } finally {
                setInvoiceToDelete(null);
            }
        }
    };

    if (invoices.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No invoices found for the current search.</p>;
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Invoice ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Method</TableHead>
                            <TableHead className="w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                                <TableCell className="font-medium">{invoice.name}</TableCell>
                                <TableCell>{invoice.month}</TableCell>
                                <TableCell className="text-right">PKR {invoice.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{invoice.paymentMethod}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(invoice)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View & Share</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setInvoiceToDelete(invoice)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {selectedInvoice && (
                <ViewInvoiceModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
            <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the invoice for <span className="font-bold">{invoiceToDelete?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete invoice
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    