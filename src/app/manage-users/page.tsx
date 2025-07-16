
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
import { Save, Loader2, Users } from "lucide-react";


function ManageUsersPage() {
    const { userProfiles, updateUserName } = useContext(AppContext);
    const [names, setNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const { toast } = useToast();
    
    useEffect(() => {
        const initialNames = userProfiles.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {} as Record<string, string>);
        setNames(initialNames);
    }, [userProfiles]);

    const handleNameChange = (userId: string, value: string) => {
        setNames(prev => ({ ...prev, [userId]: value }));
    };

    const handleSaveName = async (userId: string, currentName: string) => {
        const newName = names[userId];
        if (newName && newName !== currentName) {
            setLoading(prev => ({ ...prev, [userId]: true }));
            try {
                await updateUserName(userId, newName);
                toast({
                    title: "Name Updated",
                    description: `User "${currentName}" has been renamed to "${newName}".`,
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: error.message || "Could not update the name.",
                });
                // Revert the change in the input on failure
                setNames(prev => ({ ...prev, [userId]: currentName }));
            } finally {
                setLoading(prev => ({ ...prev, [userId]: false }));
            }
        } else if (!newName) {
            toast({
                variant: "destructive",
                title: "Invalid Name",
                description: "Name cannot be empty.",
            });
        }
    };


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        <Users className="inline-block mr-2 h-8 w-8" />
                        Manage Users
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Change User Names</CardTitle>
                        <CardDescription>
                            Update the display name for any user. This will be reflected across the entire application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Current Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="w-[300px]">New Name</TableHead>
                                        <TableHead className="w-[100px] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userProfiles.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                             <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={names[user.id] ?? ''}
                                                    onChange={(e) => handleNameChange(user.id, e.target.value)}
                                                    placeholder="Enter new name"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleSaveName(user.id, user.name)} disabled={loading[user.id]}>
                                                    {loading[user.id] 
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
            <ManageUsersPage />
        </AuthGuard>
    );
}
