
"use client";

import { useState, useMemo, useContext } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, User, Calendar, Save, Trash2 } from "lucide-react";
import { getYear, getMonth, format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BillingRecord } from "@/lib/types";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

function CustomerPaymentsPage() {
    const { userProfiles, saveBillingRecord, deleteBillingRecord, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [totalBill, setTotalBill] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const sortedUsers = useMemo(() => {
        return [...userProfiles].sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles]);

    const allBillingRecords = useMemo(() => {
        return userProfiles
            .flatMap(user =>
                (user.billingRecords || []).map(record => ({
                    ...record,
                    userName: user.name,
                    balance: record.total_bill - record.amount_paid
                }))
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [userProfiles]);
    

    const handleSave = async () => {
        if (!selectedUserId || amountPaid === "" || totalBill === "") {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill all fields." });
            return;
        }
        setIsSaving(true);
        try {
            await saveBillingRecord({
                userId: selectedUserId,
                month: selectedMonth,
                year: selectedYear,
                amountPaid: Number(amountPaid),
                totalBill: Number(totalBill),
            });
            const userName = userProfiles.find(u => u.id === selectedUserId)?.name || 'the user';
            toast({
                title: "Record Saved",
                description: `Billing record for ${userName} for ${months[selectedMonth].label} ${selectedYear} has been saved.`,
            });
            // Reset form
            setSelectedUserId("");
            setAmountPaid("");
            setTotalBill("");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "Could not save billing record.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (recordId: string) => {
        setIsDeleting(recordId);
        try {
            await deleteBillingRecord(recordId);
            toast({
                title: "Record Deleted",
                description: `The billing record has been deleted successfully.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message || "Could not delete the record.",
            });
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        <DollarSign className="inline-block mr-2 h-8 w-8" />
                        Customer Payments
                    </h2>
                </div>
                <div className="grid gap-8 lg:grid-cols-5">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">Create Billing Record</CardTitle>
                            <CardDescription>
                                Add a new billing record for a customer for a specific month.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Select User</Label>
                                <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortedUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Select Billing Period</Label>
                                <div className="flex gap-2">
                                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(month => (
                                                <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => (
                                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount-paid">Amount Paid</Label>
                                    <Input id="amount-paid" type="number" placeholder="e.g., 800" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="total-bill">Total Bill</Label>
                                    <Input id="total-bill" type="number" placeholder="e.g., 1000" value={totalBill} onChange={(e) => setTotalBill(e.target.value)} />
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={isSaving || !selectedUserId} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Record
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                         <CardHeader>
                            <CardTitle className="font-headline">All Billing Records</CardTitle>
                            <CardDescription>
                                A complete history of all saved billing records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[50vh] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount Paid</TableHead>
                                            <TableHead className="text-right">Total Bill</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appContextLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                                </TableCell>
                                            </TableRow>
                                        ) : allBillingRecords.length > 0 ? (
                                            allBillingRecords.map((r: BillingRecord & { userName: string, balance: number }) => (
                                                <TableRow key={r.id}>
                                                    <TableCell className="font-medium">{r.userName}</TableCell>
                                                    <TableCell>{months[r.month].label}, {r.year}</TableCell>
                                                    <TableCell className="text-right text-green-600 font-semibold">{r.amount_paid.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{r.total_bill.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-red-600 font-semibold">{r.balance.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(r.id!)}
                                                            disabled={isDeleting === r.id}
                                                        >
                                                            {isDeleting === r.id
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <Trash2 className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                             <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    No billing records found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <CustomerPaymentsPage />
        </AuthGuard>
    );
}
    