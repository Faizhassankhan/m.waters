"use client";

import { useState } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Invoice as InvoiceType } from "@/lib/types";

function InvoicePage() {
    const [invoice, setInvoice] = useState<InvoiceType | null>(null);

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Create Invoice</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">Invoice Details</CardTitle>
                            <CardDescription>Fill in the details to generate a new invoice.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <InvoiceForm onInvoiceCreated={setInvoice} />
                        </CardContent>
                    </Card>
                    <div className="lg:col-span-3">
                        <InvoicePreview invoice={invoice} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <InvoicePage />
        </AuthGuard>
    );
}
