
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


function ManageRatesPage() {
    const { users, updateUserBottlePrice } = useContext(AppContext);
    const [rates, setRates] = useState<Record<string, number | string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const { toast } = useToast();
    
    useEffect(() => {
        const initialRates = users.reduce((acc, user) => {
            acc[user.name] = user.bottlePrice || 150;
            return acc;
        }, {} as Record<string, number>);
        setRates(initialRates);
    }, [users]);

    const handleRateChange = (userName: string, value: string) => {
        const numericValue = value === "" ? "" : Number(value);
        if (!isNaN(numericValue as number)) {
            setRates(prev => ({ ...prev, [userName]: numericValue }));
        }
    };

    const handleSaveRate = async (userName: string) => {
        const newRate = Number(rates[userName]);
        if (newRate > 0) {
            setLoading(prev => ({ ...prev, [userName]: true }));
            try {
                await updateUserBottlePrice(userName, newRate);
                toast({
                    title: "Rate Updated",
                    description: `The per-bottle rate for ${userName} has been set to ${newRate} PKR.`,
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: error.message || "Could not update the rate.",
                });
            } finally {
                setLoading(prev => ({ ...prev, [userName]: false }));
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
                            Set a custom price-per-bottle for each user. This rate will be used for automatic invoice calculations.
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
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={rates[user.name] ?? ''}
                                                    onChange={(e) => handleRateChange(user.name, e.target.value)}
                                                    placeholder="e.g., 150"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleSaveRate(user.name)} disabled={loading[user.name]}>
                                                    {loading[user.name] 
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

    