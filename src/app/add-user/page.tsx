
"use client";

import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { UserData } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

function AddUserPage() {
  const { addUser, users, deleteUser, toggleUserSharing } = useContext(AppContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await addUser(values.name);
      toast({
        title: "Success",
        description: `User "${values.name}" has been added.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Adding User",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        toast({
          title: "User Deleted",
          description: `User "${userToDelete.name}" has been removed.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Deleting User",
          description: error.message || "An unexpected error occurred.",
        });
      } finally {
        setUserToDelete(null);
      }
    }
  };

  const handleSharingToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserSharing(userId, !currentStatus);
       toast({
        title: "Permission Updated",
        description: `Sharing permissions have been updated for the user.`,
      });
    } catch(error: any) {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update sharing permissions.",
      });
    }
  }

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
              Manage Users
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                   <Card>
                      <CardHeader>
                          <CardTitle className="font-headline">Add New User</CardTitle>
                          <CardDescription>Add a new user. They will be able to log in with their name and the default password.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>User Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Add User
                              </Button>
                            </form>
                          </Form>
                      </CardContent>
                  </Card>
              </div>
              <div className="lg:col-span-3">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline">Existing Users</CardTitle>
                          <CardDescription>A list of all users currently in the system.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                              <Table>
                                  <TableHeader className="sticky top-0 bg-muted/50">
                                      <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Sharing Enabled</TableHead>
                                          <TableHead className="text-right w-[100px]">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {users.length > 0 ? (
                                          users.map((user) => (
                                              <TableRow key={user.id}>
                                                  <TableCell className="font-medium">{user.name}</TableCell>
                                                  <TableCell>
                                                      <div className="flex items-center space-x-2">
                                                        <Switch
                                                          id={`share-switch-${user.id}`}
                                                          checked={user.canShareReport}
                                                          onCheckedChange={() => handleSharingToggle(user.id, user.canShareReport)}
                                                        />
                                                        <Label htmlFor={`share-switch-${user.id}`} className="flex items-center gap-2 cursor-pointer text-xs">
                                                          <Share2 className="h-3 w-3" />
                                                          Can Share Report
                                                        </Label>
                                                      </div>
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUserToDelete(user)}>
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={3} className="h-24 text-center">
                                                  No users found. Add one to get started.
                                              </TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>
        </div>
      </DashboardLayout>
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <span className="font-bold">{userToDelete?.name}</span> and all of their associated delivery data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Yes, delete user
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
            <AddUserPage />
        </AuthGuard>
    );
}

    