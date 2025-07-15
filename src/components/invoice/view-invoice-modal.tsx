
"use client";

import { Invoice } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InvoicePreview } from "./invoice-preview";

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function ViewInvoiceModal({ invoice, onClose }: ViewInvoiceModalProps) {
  if (!invoice) return null;

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
            <DialogTitle>Invoice for {invoice.name}</DialogTitle>
            <DialogDescription>A detailed view of the invoice, ready for sharing.</DialogDescription>
        </DialogHeader>
        <InvoicePreview invoice={invoice} />
      </DialogContent>
    </Dialog>
  );
}
