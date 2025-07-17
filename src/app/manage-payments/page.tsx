
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, User, Calendar, Save, Trash2 } from "lucide-react";
import { getYear, getMonth, format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

function ManagePaymentsPage() {
    const { userProfiles, saveMonthlyStatus, deleteMonthlyStatus, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [statusToSave, setStatusToSave] = useState<'paid' | 'not_paid_yet'>('paid');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const sortedUsers = useMemo(() => {
        return [...userProfiles].sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles]);

    const allStatuses = useMemo(() => {
        return userProfiles
            .flatMap(user => 
                (user.monthlyStatuses || []).map(status => ({
                    ...status,
                    userName: user.name,
                    user_id: user.id, // Ensure user_id is available
                    statusId: `${user.id}-${status.year}-${status.month}`
                }))
            )
            .sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime());
    }, [userProfiles]);

    const handleSave = async () => {
        if (!selectedUserId) {
            toast({ variant: "destructive", title: "No User Selected", description: "Please select a user first." });
            return;
        }
        setIsSaving(true);
        try {
            await saveMonthlyStatus(selectedUserId, selectedMonth, selectedYear, statusToSave);
            const userName = userProfiles.find(u => u.id === selectedUserId)?.name || 'the user';
            toast({
                title: "Status Saved",
                description: `${userName}'s bill for ${months[selectedMonth].label} ${selectedYear} has been saved as ${statusToSave === 'paid' ? 'Paid' : 'Not Paid Yet'}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "Could not save status.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (statusId: string, userId: string, month: number, year: number) => {
        setIsDeleting(statusId);
        try {
            await deleteMonthlyStatus(userId, month, year);
            const userName = userProfiles.find(u => u.id === userId)?.name || 'the user';
            toast({
                title: "Status Deleted",
                description: `The status for ${userName} for ${months[month].label} ${year} has been reset.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message || "Could not delete the status.",
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
                        <CreditCard className="inline-block mr-2 h-8 w-8" />
                        Manage Customer Payments
                    </h2>
                </div>
                <div className="grid gap-8 lg:grid-cols-5">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">Set Payment Status</CardTitle>
                            <CardDescription>
                                Select a user and billing period to mark their payment status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Select User</Label>
                                <Select onValueChange={setSelectedUserId} value={selectedUserId || ""}>
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
                            
                             <div className="space-y-2">
                                <Label className="flex items-center gap-2">Set Status</Label>
                                <RadioGroup defaultValue="paid" value={statusToSave} onValueChange={(value: 'paid' | 'not_paid_yet') => setStatusToSave(value)} className="flex items-center gap-6 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="paid" id="r-paid" />
                                        <Label htmlFor="r-paid" className="font-normal cursor-pointer">Paid</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="not_paid_yet" id="r-unpaid" />
                                        <Label htmlFor="r-unpaid" className="font-normal cursor-pointer">Unpaid</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Button onClick={handleSave} disabled={isSaving || !selectedUserId} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Status
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                         <CardHeader>
                            <CardTitle className="font-headline">Saved Statuses</CardTitle>
                            <CardDescription>
                                A list of all payment statuses you have saved.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[50vh] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appContextLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                                </TableCell>
                                            </TableRow>
                                        ) : allStatuses.length > 0 ? (
                                            allStatuses.map(s => (
                                                <TableRow key={s.statusId}>
                                                    <TableCell className="font-medium">{s.userName}</TableCell>
                                                    <TableCell>{months[s.month].label}, {s.year}</TableCell>
                                                    <TableCell>
                                                        <span className={s.status === 'paid' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                            {s.status === 'paid' ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(s.statusId, s.user_id, s.month, s.year)}
                                                            disabled={isDeleting === s.statusId}
                                                        >
                                                            {isDeleting === s.statusId
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <Trash2 className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                             <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No statuses have been saved yet.
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
            <ManagePaymentsPage />
        </AuthGuard>
    );
}
