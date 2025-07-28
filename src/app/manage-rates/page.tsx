
"use client";

import { useContext, useState, useEffect } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppContext } from "@/contexts/app-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import { UserProfile } from "@/lib/types";

function ManageRatesPage() {
    const { userProfiles, updateUserBottlePrice, loading: appContextLoading } = useContext(AppContext);
    // This state now only holds the changes made by the user, not the source of truth.
    const [editingRates, setEditingRates] = useState<Record<string, number | string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    // When user profiles are updated from context, we clear the local edits.
    useEffect(() => {
        setEditingRates({});
    }, [userProfiles]);

    const handleRateChange = (userId: string, value: string) => {
        const numericValue = value === "" ? "" : Number(value);
         if (!isNaN(numericValue as number)) {
            setEditingRates(prev => ({ ...prev, [userId]: numericValue }));
        }
    };

    const handleSaveRate = async (userId: string, userName: string) => {
        const rateToSave = editingRates[userId];

        // Check if there is actually a new rate to save for this user
        if (rateToSave === undefined || rateToSave === '') {
             toast({
                variant: "destructive",
                title: "No Change",
                description: "Please enter a new rate before saving.",
            });
            return;
        }

        const newRate = Number(rateToSave);
        if (newRate > 0) {
            setLoadingStates(prev => ({ ...prev, [userId]: true }));
            try {
                // The context function handles the DB update and data refresh.
                await updateUserBottlePrice(userId, newRate);
                toast({
                    title: "Rate Updated",
                    description: `The per-bottle rate for ${userName} has been set to ${newRate} PKR.`,
                });
                // After successful save, clear the editing state for this user.
                setEditingRates(prev => {
                    const newEditingRates = { ...prev };
                    delete newEditingRates[userId];
                    return newEditingRates;
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: error.message || "Could not update the rate.",
                });
            } finally {
                setLoadingStates(prev => ({ ...prev, [userId]: false }));
            }
        } else {
            toast({
                variant: "destructive",
                title: "Invalid Rate",
                description: "Please enter a valid positive number for the rate.",
            });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Manage User Rates
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Per-Bottle Price</CardTitle>
                        <CardDescription>
                            Set a custom price-per-bottle for each user. This rate will be used for automatic invoice calculations. The value shown is the current rate from the database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead className="w-[200px]">Rate (PKR)</TableHead>
                                        <TableHead className="w-[100px] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appContextLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                 <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : userProfiles.sort((a,b) => a.name.localeCompare(b.name)).map((user: UserProfile) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    // The displayed value is either the one being edited, or the one from the database (user.bottlePrice).
                                                    value={editingRates[user.id] ?? user.bottlePrice ?? ''}
                                                    onChange={(e) => handleRateChange(user.id, e.target.value)}
                                                    placeholder="e.g., 100"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleSaveRate(user.id, user.name)} disabled={loadingStates[user.id] || editingRates[user.id] === undefined}>
                                                    {loadingStates[user.id] 
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <><Save className="mr-2 h-4 w-4" /> Save</>
                                                    }
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
            <ManageRatesPage />
        </AuthGuard>
    );
}
