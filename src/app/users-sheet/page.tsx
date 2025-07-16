
"use client";

import { useContext, useMemo } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_BOTTLE_PRICE = 150;

function UsersSheetPage() {
    const { users } = useContext(AppContext);

    const usersSummary = useMemo(() => {
        return users.map(user => {
            const totalBottles = user.deliveries.reduce((sum, delivery) => sum + delivery.bottles, 0);
            const bottlePrice = user.bottlePrice || DEFAULT_BOTTLE_PRICE;
            const totalBill = totalBottles * bottlePrice;
            return {
                ...user,
                totalBottles,
                totalBill
            };
        }).sort((a, b) => b.totalBottles - a.totalBottles); // Sort by most bottles
    }, [users]);

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Users Sheet
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">All-Time User Summary</CardTitle>
                        <CardDescription>
                            A summary of total bottles and billings for each user based on their set rate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Total Bottles</TableHead>
                                        <TableHead className="text-right">T.Bill (PKR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersSummary.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-right font-bold">{user.totalBottles.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{user.totalBill.toLocaleString()}</TableCell>
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
            <UsersSheetPage />
        </AuthGuard>
    );
}
