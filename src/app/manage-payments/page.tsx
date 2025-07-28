
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Save, Trash2 } from "lucide-react";
import { getYear, getMonth, format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

function ManagePaymentsPage() {
    const { userProfiles, saveMonthlyStatus, loading: appContextLoading, fetchAllData } = useContext(AppContext);
    const { toast } = useToast();

    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [statusToSave, setStatusToSave] = useState<'paid' | 'not_paid_yet'>('paid');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const usersForPeriod = useMemo(() => {
        return userProfiles
            .filter(user => 
                (user.billingRecords || []).some(br => br.month === selectedMonth && br.year === selectedYear) ||
                (user.deliveries || []).some(d => {
                    const deliveryDate = new Date(d.date);
                    return getMonth(deliveryDate) === selectedMonth && getYear(deliveryDate) === selectedYear;
                })
            )
            .map(user => {
                const statusEntry = (user.monthlyStatuses || []).find(s => s.month === selectedMonth && s.year === selectedYear);
                return {
                    id: user.id,
                    name: user.name,
                    status: statusEntry ? statusEntry.status : 'not_paid_yet',
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles, selectedMonth, selectedYear]);

    useEffect(() => {
        // By default, check all users that are displayed for the selected period
        setSelectedUserIds(new Set(usersForPeriod.map(u => u.id)));
    }, [usersForPeriod]);

    const handleSave = async () => {
        if (selectedUserIds.size === 0) {
            toast({ variant: "destructive", title: "No Users Selected", description: "Please select at least one user." });
            return;
        }
        setIsSaving(true);
        try {
            const promises = Array.from(selectedUserIds).map(userId => 
                saveMonthlyStatus(userId, selectedMonth, selectedYear, statusToSave)
            );
            
            await Promise.all(promises);

            toast({
                title: "Statuses Saved",
                description: `The status for ${selectedUserIds.size} user(s) for ${months[selectedMonth].label} ${selectedYear} has been set to ${statusToSave === 'paid' ? 'Paid' : 'Unpaid'}.`,
            });
            await fetchAllData(null); // Refresh all data silently
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "Could not save statuses.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(new Set(usersForPeriod.map(u => u.id)));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleUserSelection = (userId: string, checked: boolean) => {
        const newSet = new Set(selectedUserIds);
        if (checked) {
            newSet.add(userId);
        } else {
            newSet.delete(userId);
        }
        setSelectedUserIds(newSet);
    };

    const areAllSelected = usersForPeriod.length > 0 && selectedUserIds.size === usersForPeriod.length;

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        <CreditCard className="inline-block mr-2 h-8 w-8" />
                        Manage Customer Payments
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Set Bulk Payment Status</CardTitle>
                        <CardDescription>
                            Select a billing period, choose users, and set their payment status all at once.
                        </CardDescription>
                        <div className="flex flex-wrap items-end gap-4 pt-4">
                            <div>
                                <Label>Billing Period</Label>
                                <div className="flex items-center space-x-2 pt-1">
                                    <Select 
                                        value={String(selectedMonth)} 
                                        onValueChange={(value) => setSelectedMonth(Number(value))}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by Month" />
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
                                        onValueChange={(value) => setFilterYear(Number(value))}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Filter by Year" />
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
                            </div>
                            <div>
                                <Label>Set Status To</Label>
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
                            <Button onClick={handleSave} disabled={isSaving || selectedUserIds.size === 0}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save for {selectedUserIds.size} User(s)
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[50vh] rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                             <Checkbox
                                                checked={areAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appContextLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : usersForPeriod.length > 0 ? (
                                        usersForPeriod.map(s => (
                                            <TableRow key={s.id} data-state={selectedUserIds.has(s.id) && "selected"}>
                                                <TableCell>
                                                     <Checkbox
                                                        checked={selectedUserIds.has(s.id)}
                                                        onCheckedChange={(checked) => handleUserSelection(s.id, !!checked)}
                                                        aria-label={`Select ${s.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{s.name}</TableCell>
                                                <TableCell>
                                                    <span className={s.status === 'paid' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                        {s.status === 'paid' ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No users with deliveries or billing records found for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
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
