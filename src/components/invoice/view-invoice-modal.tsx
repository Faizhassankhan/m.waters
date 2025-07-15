
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
      <DialogContent className="max-w-none w-auto sm:max-w-3xl p-0">
        <InvoicePreview invoice={invoice} />
      </DialogContent>
    </Dialog>
  );
}
