
"use client";

import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, MessageSquareQuote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { Feedback } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function CustomerFeedbacksPage() {
    const { feedbacks, deleteFeedback, loading: appContextLoading } = useContext(AppContext);
    const { toast } = useToast();
    
    const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

    const sortedFeedbacks = useMemo(() => {
        return [...feedbacks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [feedbacks]);

    const handleDelete = async () => {
        if (feedbackToDelete) {
            try {
                await deleteFeedback(feedbackToDelete.id);
                toast({
                    title: "Feedback Deleted",
                    description: `Feedback from "${feedbackToDelete.user_name}" has been removed.`,
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error Deleting Feedback",
                    description: error.message || "An unexpected error occurred.",
                });
            } finally {
                setFeedbackToDelete(null);
            }
        }
    };
  
    return (
        <>
            <DashboardLayout>
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    <div className="flex items-center justify-between space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                            <MessageSquareQuote className="h-8 w-8" />
                            Customer Feedbacks
                        </h2>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">All Feedbacks</CardTitle>
                            <CardDescription>Here you can view all feedbacks submitted by your customers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[70vh]">
                                <div className="space-y-6 pr-6">
                                    {appContextLoading ? (
                                        <div className="flex justify-center items-center h-48">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : sortedFeedbacks.length > 0 ? (
                                        sortedFeedbacks.map((feedback, index) => (
                                            <div key={feedback.id}>
                                                <Card className="shadow-md">
                                                    <CardHeader className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg font-semibold">{feedback.user_name}</CardTitle>
                                                                <CardDescription className="text-xs">
                                                                    {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                                                                </CardDescription>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => setFeedbackToDelete(feedback)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-0">
                                                        <p className="text-sm text-foreground">{feedback.feedback_text}</p>
                                                    </CardContent>
                                                </Card>
                                                {index < sortedFeedbacks.length - 1 && <Separator className="mt-6" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-center items-center h-48 border border-dashed rounded-lg">
                                            <p className="text-muted-foreground">No feedbacks submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            <AlertDialog open={!!feedbackToDelete} onOpenChange={() => setFeedbackToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the feedback from <span className="font-bold">{feedbackToDelete?.user_name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete feedback
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
            <CustomerFeedbacksPage />
        </AuthGuard>
    );
}

    