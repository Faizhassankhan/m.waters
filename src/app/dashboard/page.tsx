
"use client";

import { useContext } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/data/data-table";
import { AddDataForm } from "@/components/data/add-data-form";

function AdminDashboardPage() {
    const { userProfiles } = useContext(AppContext);

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 pt-6">
                 <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">Add Delivery</CardTitle>
                            <CardDescription>Add a new delivery record for any existing profile.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddDataForm />
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="font-headline">Delivery Records</CardTitle>
                             <CardDescription>A monthly summary of all delivery data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={userProfiles} />
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
            <AdminDashboardPage />
        </AuthGuard>
    )
}
