
"use client";

import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InvoiceList } from "@/components/invoice/invoice-list";

function InvoicesPage() {
    const { invoices } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredInvoices = useMemo(() => {
        if (!searchTerm) {
            return invoices;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return invoices.filter(
            (invoice) =>
                invoice.name.toLowerCase().includes(lowercasedTerm) ||
                invoice.id.toLowerCase().includes(lowercasedTerm) ||
                invoice.month.toLowerCase().includes(lowercasedTerm)
        );
    }, [invoices, searchTerm]);

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Search Invoices
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex justify-between items-center">
                            <span>All Invoices</span>
                            <div className="w-full max-w-sm">
                                <Input
                                    placeholder="Search by name, ID, or month..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Here you can find all previously generated invoices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvoiceList invoices={filteredInvoices} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}


export default function Home() {
    return (
        <AuthGuard>
            <InvoicesPage />
        </AuthGuard>
    );
}
