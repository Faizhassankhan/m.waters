
"use client";

import { useState, useMemo, useContext } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getYear, getMonth, format } from "date-fns";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

function MarkPaymentsPage() {
    const { userProfiles, updateMonthlyStatus, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();

    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    const usersForSelectedPeriod = useMemo(() => {
        return userProfiles
            .filter(user => 
                user.deliveries.some(d => {
                    const deliveryDate = new Date(d.date);
                    return getMonth(deliveryDate) === selectedMonth && getYear(deliveryDate) === selectedYear;
                })
            )
            .map(user => {
                const statusEntry = user.monthlyStatuses.find(s => s.month === selectedMonth && s.year === selectedYear);
                return {
                    id: user.id,
                    name: user.name,
                    status: statusEntry ? statusEntry.status : 'not_paid_yet',
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles, selectedMonth, selectedYear]);

    const handleStatusUpdate = async (userId: string, userName: string, newStatus: 'paid' | 'not_paid_yet') => {
        setLoadingStates(prev => ({ ...prev, [userId]: true }));
        try {
            await updateMonthlyStatus(userId, selectedMonth, selectedYear, newStatus);
            toast({
                title: "Status Updated",
                description: `${userName}'s bill for ${months[selectedMonth].label} ${selectedYear} has been marked as ${newStatus === 'paid' ? 'Paid' : 'Not Paid Yet'}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update status.",
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Mark Customer Payments
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Select Billing Period</CardTitle>
                        <CardDescription>
                            Choose a month and year to see all customers with deliveries in that period and mark their payment status.
                        </CardDescription>
                         <div className="flex items-center space-x-2 pt-4">
                            <Select 
                                value={String(selectedMonth)} 
                                onValueChange={(value) => setSelectedMonth(Number(value))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month.value} value={String(month.value)}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={String(selectedYear)} 
                                onValueChange={(value) => setSelectedYear(Number(value))}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(year => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead className="text-center">Current Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appContextLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : usersForSelectedPeriod.length > 0 ? (
                                        usersForSelectedPeriod.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={user.status === 'paid' ? 'success' : 'destructive'}>
                                                        {user.status === 'paid' ? 'Paid' : 'Not Paid Yet'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {loadingStates[user.id] ? (
                                                        <Button size="sm" disabled>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        </Button>
                                                    ) : (
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                                                onClick={() => handleStatusUpdate(user.id, user.name, 'paid')}
                                                                disabled={user.status === 'paid'}
                                                            >
                                                                <CheckCircle className="mr-2" /> Mark as Paid
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                                                                onClick={() => handleStatusUpdate(user.id, user.name, 'not_paid_yet')}
                                                                disabled={user.status === 'not_paid_yet'}
                                                            >
                                                                <XCircle className="mr-2" /> Mark as Not Paid
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No customers with deliveries found for the selected period.
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
