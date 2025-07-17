
"use client";

import { useState, useContext, useEffect, useCallback } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserDataPreview } from "@/components/data/user-data-preview";
import { AddDataForm } from "@/components/data/add-data-form";
import { UserProfile } from "@/lib/types";
import { useSearchParams } from 'next/navigation'


function SearchDataPage() {
    const { userProfiles, refreshData } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const searchParams = useSearchParams();

    // Effect to handle search query from URL (e.g., from Data Table)
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchTerm(query);
            const foundProfile = userProfiles.find(profile => profile.name.toLowerCase() === query.toLowerCase());
            setSelectedProfile(foundProfile || null);
        }
    }, [searchParams, userProfiles]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.trim() === "") {
            setSelectedProfile(null);
            return;
        }
        const foundProfile = userProfiles.find(profile => profile.name.toLowerCase().includes(term.toLowerCase()));
        setSelectedProfile(foundProfile || null);
    }
    
    // This effect ensures that if the user data is updated globally,
    // the currently viewed user is also updated.
    useEffect(() => {
        if (selectedProfile) {
            const updatedProfile = userProfiles.find(p => p.id === selectedProfile.id);
            setSelectedProfile(updatedProfile || null);
        }
    }, [userProfiles, selectedProfile?.id]);


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Search Profile Data
                    </h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2 space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Find Profile</CardTitle>
                                <CardDescription>Search for a data profile by name to see its delivery history.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Enter profile name..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </CardContent>
                        </Card>
                        {selectedProfile && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Add Delivery for {selectedProfile.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AddDataForm initialName={selectedProfile.name} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                   
                    <div className="lg:col-span-3">
                        <UserDataPreview profile={selectedProfile} onRefresh={refreshData} />
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
