
"use client";

import { useState, useContext, useMemo, useEffect } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getYear, getMonth, format } from "date-fns";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

function MarkPaymentsPage() {
    const { userProfiles, updateMonthlyStatus } = useContext(AppContext);
    const { toast } = useToast();
    const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({});

    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        userProfiles.forEach(user => {
            user.deliveries.forEach(delivery => {
                years.add(getYear(new Date(delivery.date)));
            });
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [userProfiles]);
    
    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    const usersForSelectedPeriod = useMemo(() => {
        return userProfiles
            .map(user => {
                const hasDeliveriesInPeriod = user.deliveries.some(d => {
                    const deliveryDate = new Date(d.date);
                    return getMonth(deliveryDate) === selectedMonth && getYear(deliveryDate) === selectedYear;
                });

                if (!hasDeliveriesInPeriod) return null;

                const statusRecord = user.monthlyStatuses?.find(s => s.month === selectedMonth && s.year === selectedYear);
                const currentStatus = statusRecord?.status || 'not_paid_yet';

                return {
                    id: user.id,
                    name: user.name,
                    status: currentStatus,
                };
            })
            .filter((user): user is { id: string, name: string, status: 'paid' | 'not_paid_yet' } => user !== null);
    }, [userProfiles, selectedMonth, selectedYear]);

    const handleStatusChange = async (userId: string, newStatus: "paid" | "not_paid_yet") => {
        setLoadingStatus(prev => ({ ...prev, [userId]: true }));
        try {
            await updateMonthlyStatus(userId, selectedMonth, selectedYear, newStatus);
            toast({
                title: "Status Updated",
                description: `Status for the selected month has been updated.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update status.",
            });
        } finally {
            setLoadingStatus(prev => ({ ...prev, [userId]: false }));
        }
    };

    const getStatusVariant = (status: 'paid' | 'not_paid_yet') => {
        return status === 'paid' ? 'success' : 'destructive';
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        <CreditCard className="inline-block mr-2 h-8 w-8" />
                        Monthly Payment Status
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Manage Payment Status</CardTitle>
                        <CardDescription>
                            Select a month and year to view and update the payment status for each user. This status will be visible to the customer on their dashboard.
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
                                disabled={availableYears.length === 0}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
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
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-center">Current Status</TableHead>
                                        <TableHead className="w-[250px] text-center">Update Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersForSelectedPeriod.length > 0 ? (
                                        usersForSelectedPeriod.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(user.status)}>
                                                        {user.status === 'paid' ? 'Paid' : 'Not Paid Yet'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {loadingStatus[user.id] ? (
                                                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                                                    ) : (
                                                      <div className="flex gap-2 justify-center">
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 disabled:bg-green-100 disabled:text-green-400"
                                                              onClick={() => handleStatusChange(user.id, 'paid')}
                                                              disabled={user.status === 'paid'}
                                                          >
                                                              <CheckCircle className="mr-2 h-4 w-4" /> Paid
                                                          </Button>
                                                          <Button
                                                              size="sm"
                                                              variant="outline"
                                                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 disabled:bg-red-100 disabled:text-red-400"
                                                              onClick={() => handleStatusChange(user.id, 'not_paid_yet')}
                                                              disabled={user.status === 'not_paid_yet'}
                                                          >
                                                              <XCircle className="mr-2 h-4 w-4" /> Not Paid
                                                          </Button>
                                                      </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No users with deliveries found for the selected period.
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
