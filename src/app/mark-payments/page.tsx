
"use client";

import { useState, useContext } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Invoice } from "@/lib/types";

function MarkPaymentsPage() {
    const { invoices, updateInvoiceStatus, updateInvoiceVisibility } = useContext(AppContext);
    const { toast } = useToast();
    const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({});
    const [loadingVisibility, setLoadingVisibility] = useState<Record<string, boolean>>({});

    const handleStatusChange = async (invoiceId: string, newStatus: "paid" | "not_paid_yet") => {
        setLoadingStatus(prev => ({ ...prev, [invoiceId]: true }));
        try {
            await updateInvoiceStatus(invoiceId, newStatus);
            toast({
                title: "Status Updated",
                description: `Invoice status has been changed to ${newStatus === 'paid' ? 'Paid' : 'Not Paid Yet'}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update status.",
            });
        } finally {
            setLoadingStatus(prev => ({ ...prev, [invoiceId]: false }));
        }
    };

    const handleVisibilityChange = async (invoiceId: string, newVisibility: boolean) => {
        setLoadingVisibility(prev => ({ ...prev, [invoiceId]: true }));
        try {
            await updateInvoiceVisibility(invoiceId, newVisibility);
            toast({
                title: "Visibility Updated",
                description: `Status will now be ${newVisibility ? 'shown to' : 'hidden from'} the customer.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update visibility.",
            });
        } finally {
            setLoadingVisibility(prev => ({ ...prev, [invoiceId]: false }));
        }
    }

    const getStatusVariant = (status: string | null | undefined) => {
        switch (status) {
            case 'paid': return 'success';
            case 'not_paid_yet': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Mark Invoice Payments
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Manage Payment Status</CardTitle>
                        <CardDescription>
                            Update the payment status for each generated invoice. This status will be visible to the customer only when you choose to show it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Month</TableHead>
                                        <TableHead className="text-right">Amount (PKR)</TableHead>
                                        <TableHead className="text-center">Current Status</TableHead>
                                        <TableHead className="w-[200px] text-center">Update Status</TableHead>
                                        <TableHead className="w-[200px] text-center">Customer Visibility</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length > 0 ? (
                                        invoices.map((invoice: Invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">{invoice.name}</TableCell>
                                                <TableCell>{invoice.month}</TableCell>
                                                <TableCell className="text-right">{invoice.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(invoice.paymentStatus)}>
                                                        {invoice.paymentStatus === 'paid' ? 'Paid' : 'Not Paid Yet'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {loadingStatus[invoice.id] ? (
                                                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                                                    ) : (
                                                      <div className="flex gap-2 justify-center">
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                              disabled={invoice.paymentStatus === 'paid'}
                                                          >
                                                              <CheckCircle2 className="mr-2 h-4 w-4" /> Paid
                                                          </Button>
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                                              onClick={() => handleStatusChange(invoice.id, 'not_paid_yet')}
                                                              disabled={invoice.paymentStatus !== 'paid'}
                                                          >
                                                              <XCircle className="mr-2 h-4 w-4" /> Not Paid
                                                          </Button>
                                                      </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {loadingVisibility[invoice.id] ? (
                                                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                                                    ) : (
                                                      <div className="flex gap-2 justify-center">
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={() => handleVisibilityChange(invoice.id, true)}
                                                              disabled={invoice.showStatusToCustomer}
                                                          >
                                                              <Eye className="mr-2 h-4 w-4" /> Show
                                                          </Button>
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              className="text-muted-foreground"
                                                              onClick={() => handleVisibilityChange(invoice.id, false)}
                                                              disabled={!invoice.showStatusToCustomer}
                                                          >
                                                              <EyeOff className="mr-2 h-4 w-4" /> Hide
                                                          </Button>
                                                      </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No invoices found. Create an invoice to mark its payment.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <MarkPaymentsPage />
        </AuthGuard>
    );
}
