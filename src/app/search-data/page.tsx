
"use client";

import { useState, useContext, useMemo } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserDataPreview } from "@/components/data/user-data-preview";
import { AddDataForm } from "@/components/data/add-data-form";
import { UserData } from "@/lib/types";

function SearchDataPage() {
    const { users } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.trim() === "") {
            setSelectedUser(null);
            return;
        }
        const foundUser = users.find(user => user.name.toLowerCase().includes(term.toLowerCase()));
        setSelectedUser(foundUser || null);
    }
    
    // This function will be called from UserDataPreview after a delivery is added
    const refreshUserData = () => {
        if (selectedUser) {
            const updatedUser = users.find(u => u.name === selectedUser.name);
            setSelectedUser(updatedUser || null);
        }
    };


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
                                    onChange={handleSearch}
                                />
                            </CardContent>
                        </Card>
                        {selectedUser && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Add Delivery for {selectedUser.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AddDataForm onSave={refreshUserData} initialName={selectedUser.name} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                   
                    <div className="lg:col-span-3">
                        <UserDataPreview user={selectedUser} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}


export default function Home() {
    return (
        <AuthGuard>
            <SearchDataPage />
        </AuthGuard>
    );
}
