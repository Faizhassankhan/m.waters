
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, CreditCard, User, Calendar, Check, Ban } from "lucide-react";
import { getYear, getMonth, format } from "date-fns";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

function ManagePaymentsPage() {
    const { userProfiles, updateMonthlyStatus, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [loading, setLoading] = useState(false);

    const sortedUsers = useMemo(() => {
        return [...userProfiles].sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles]);

    const currentStatus = useMemo(() => {
        if (!selectedUserId) return 'unknown';
        const user = userProfiles.find(u => u.id === selectedUserId);
        const statuses = user?.monthlyStatuses || [];
        const statusEntry = statuses.find(s => s.month === selectedMonth && s.year === selectedYear);
        return statusEntry ? statusEntry.status : 'not_paid_yet';
    }, [userProfiles, selectedUserId, selectedMonth, selectedYear]);

    const handleStatusUpdate = async (newStatus: 'paid' | 'not_paid_yet') => {
        if (!selectedUserId) {
            toast({ variant: "destructive", title: "No User Selected", description: "Please select a user first." });
            return;
        }
        setLoading(true);
        try {
            const userName = userProfiles.find(u => u.id === selectedUserId)?.name || 'the user';
            await updateMonthlyStatus(selectedUserId, selectedMonth, selectedYear, newStatus);
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
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        <CreditCard className="inline-block mr-2 h-8 w-8" />
                        Manage Payments
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Mark Payment Status</CardTitle>
                        <CardDescription>
                            Select a user and a billing period to mark their payment status. This is independent of any invoice.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Select User</label>
                                <Select onValueChange={setSelectedUserId} value={selectedUserId || undefined}>
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
                                <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Select Month</label>
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
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Select Year</label>
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

                        {selectedUserId && (
                             <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardDescription>Actions for <span className="font-bold">{userProfiles.find(u => u.id === selectedUserId)?.name}</span> for <span className="font-bold">{months[selectedMonth].label} {selectedYear}</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Current Status:</span>
                                        {currentStatus === 'paid' && <span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Paid</span>}
                                        {currentStatus === 'not_paid_yet' && <span className="font-bold text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> Not Paid Yet</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                            onClick={() => handleStatusUpdate('paid')}
                                            disabled={loading || currentStatus === 'paid'}
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <><Check className="mr-2" /> Mark as Paid</>}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                                            onClick={() => handleStatusUpdate('not_paid_yet')}
                                            disabled={loading || currentStatus === 'not_paid_yet'}
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <><Ban className="mr-2" /> Mark as Unpaid</>}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <ManagePaymentsPage />
        </AuthGuard>
    );
}
