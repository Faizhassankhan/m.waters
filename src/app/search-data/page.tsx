
"use client";

import { useState, useContext, useEffect, useCallback } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserDataPreview } from "@/components/data/user-data-preview";
import { AddDataForm } from "@/components/data/add-data-form";
import { UserData } from "@/lib/types";
import { useSearchParams } from 'next/navigation'


function SearchDataPage() {
    const { users, refreshData } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const searchParams = useSearchParams();

    // Effect to handle search query from URL (e.g., from Data Table)
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchTerm(query);
            const foundUser = users.find(user => user.name.toLowerCase() === query.toLowerCase());
            setSelectedUser(foundUser || null);
        }
    }, [searchParams, users]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.trim() === "") {
            setSelectedUser(null);
            return;
        }
        const foundUser = users.find(user => user.name.toLowerCase().includes(term.toLowerCase()));
        setSelectedUser(foundUser || null);
    }
    
    // This effect ensures that if the user data is updated globally,
    // the currently viewed user is also updated.
    useEffect(() => {
        if (selectedUser) {
            const updatedUser = users.find(u => u.id === selectedUser.id);
            setSelectedUser(updatedUser || null);
        }
    }, [users, selectedUser?.id]);


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Search User Data
                    </h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2 space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Find User</CardTitle>
                                <CardDescription>Search for a user by their name to see their delivery history.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Enter user name..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </CardContent>
                        </Card>
                        {selectedUser && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Add Delivery for {selectedUser.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AddDataForm onSave={refreshData} initialName={selectedUser.name} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                   
                    <div className="lg:col-span-3">
                        <UserDataPreview user={selectedUser} onRefresh={refreshData} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Wrap with a Suspense boundary if needed, or just export a container component
// that doesn't rely on searchParams at the top level. For this page, it's fine.
export default function Home() {
    return (
        <AuthGuard>
            <SearchDataPage />
        </AuthGuard>
    );
}

    