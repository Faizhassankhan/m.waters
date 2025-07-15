
"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Eye } from "lucide-react";
import { ViewInvoiceModal } from "./view-invoice-modal";

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        </>
    );
}

