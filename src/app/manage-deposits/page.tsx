
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
import { Save, Loader2, Award } from "lucide-react";
import { UserProfile } from "@/lib/types";

function ManageDepositsPage() {
    const { userProfiles, updateUserDeposits, loading: appContextLoading } = useContext(AppContext);
    const [editingBottles, setEditingBottles] = useState<Record<string, string>>({});
    const [editingAdvance, setEditingAdvance] = useState<Record<string, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const handleValueChange = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>, userId: string, value: string) => {
        setter(prev => ({ ...prev, [userId]: value }));
    };

    const handleSaveDeposits = async (user: UserProfile) => {
        const bottlesStr = editingBottles[user.id];
        const advanceStr = editingAdvance[user.id];

        // Use current values from profile if not being edited
        const bottlesToSave = bottlesStr !== undefined ? Number(bottlesStr) : user.depositBottles;
        const advanceToSave = advanceStr !== undefined ? Number(advanceStr) : user.depositAdvance;

        if (isNaN(bottlesToSave) || isNaN(advanceToSave) || bottlesToSave < 0 || advanceToSave < 0) {
             toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Please enter valid, non-negative numbers for deposits.",
            });
            return;
        }

        setLoadingStates(prev => ({ ...prev, [user.id]: true }));
        try {
            await updateUserDeposits(user.id, bottlesToSave, advanceToSave);
            toast({
                title: "Deposits Updated",
                description: `Deposit information for ${user.name} has been saved.`,
            });
            // Clear editing state for this user
            setEditingBottles(prev => {
                const newState = { ...prev };
                delete newState[user.id];
                return newState;
            });
             setEditingAdvance(prev => {
                const newState = { ...prev };
                delete newState[user.id];
                return newState;
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update deposits.",
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const isSaveDisabled = (userId: string) => {
        return loadingStates[userId] || (editingBottles[userId] === undefined && editingAdvance[userId] === undefined);
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <Award /> Manage Customer Deposits
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Security & Advance Deposits</CardTitle>
                        <CardDescription>
                            Set the number of security bottles and any advance deposit amount for each customer. This information will be visible to the customer in their panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead className="w-[200px]">Deposit Bottles (QTY)</TableHead>
                                        <TableHead className="w-[200px]">Advance Deposit (PKR)</TableHead>
                                        <TableHead className="w-[100px] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appContextLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                 <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : userProfiles.sort((a,b) => a.name.localeCompare(b.name)).map((user: UserProfile) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={editingBottles[user.id] ?? user.depositBottles ?? ''}
                                                    onChange={(e) => handleValueChange(setEditingBottles, user.id, e.target.value)}
                                                    placeholder="e.g., 5"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={editingAdvance[user.id] ?? user.depositAdvance ?? ''}
                                                    onChange={(e) => handleValueChange(setEditingAdvance, user.id, e.target.value)}
                                                    placeholder="e.g., 1000"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleSaveDeposits(user)} disabled={isSaveDisabled(user.id)}>
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
            <ManageDepositsPage />
        </AuthGuard>
    );
}
