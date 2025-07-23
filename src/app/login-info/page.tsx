
"use client";

import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, History } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoginHistory } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function LoginInfoPage() {
    const { loginHistory, deleteLoginHistory, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();
    
    const [historyToDelete, setHistoryToDelete] = useState<LoginHistory | null>(null);

    const sortedHistory = useMemo(() => {
        return [...loginHistory].sort((a, b) => new Date(b.login_at).getTime() - new Date(a.login_at).getTime());
    }, [loginHistory]);

    const handleDelete = async () => {
        if (historyToDelete) {
            try {
                await deleteLoginHistory(historyToDelete.id);
                toast({
                    title: "Record Deleted",
                    description: `Login record for "${historyToDelete.user_name}" has been removed.`,
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error Deleting Record",
                    description: error.message || "An unexpected error occurred.",
                });
            } finally {
                setHistoryToDelete(null);
            }
        }
    };
  
    return (
        <>
            <DashboardLayout>
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    <div className="flex items-center justify-between space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                            <History className="h-8 w-8" />
                            Customer Login Info
                        </h2>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Login History</CardTitle>
                            <CardDescription>A record of all customer logins.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[70vh] rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Customer Name</TableHead>
                                      <TableHead>Login Date</TableHead>
                                      <TableHead>Login Time</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {appContextLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedHistory.length > 0 ? (
                                        sortedHistory.map((entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.user_name}</TableCell>
                                            <TableCell>{format(new Date(entry.login_at), "EEEE, dd MMMM yyyy")}</TableCell>
                                            <TableCell>{format(new Date(entry.login_at), "hh:mm:ss a")}</TableCell>
                                            <TableCell className="text-right">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-destructive hover:text-destructive"
                                                  onClick={() => setHistoryToDelete(entry)}
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No login history found.
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

            <AlertDialog open={!!historyToDelete} onOpenChange={() => setHistoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the login record for <span className="font-bold">{historyToDelete?.user_name}</span> from <span className="font-bold">{historyToDelete ? format(new Date(historyToDelete.login_at), 'MMM dd, yyyy') : ''}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <LoginInfoPage />
        </AuthGuard>
    );
}
