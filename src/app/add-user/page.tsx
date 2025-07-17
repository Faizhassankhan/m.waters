
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
import { Loader2, UserPlus, Trash2, UserCog } from "lucide-react";
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
import { UserProfile } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

function AddUserPage() {
  const { 
    userProfiles, 
    addUserProfile, 
    deleteUserProfile,
  } = useContext(AppContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await addUserProfile(values.name, values.email, values.password);
      toast({
        title: "Success",
        description: `Customer "${values.name}" has been created. They can now log in with the password you set.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Adding Customer",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProfile = async () => {
    if (profileToDelete) {
      try {
        await deleteUserProfile(profileToDelete.id);
        toast({
          title: "Customer Deleted",
          description: `Customer "${profileToDelete.name}" has been removed.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Deleting Customer",
          description: error.message || "An unexpected error occurred.",
        });
      } finally {
        setProfileToDelete(null);
      }
    }
  };
  
  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
              Manage Customers
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><UserCog /> Add New Customer</CardTitle>
                <CardDescription>
                  Create customer profiles here. This will create an authenticated user account and a data profile for them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Email</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., jane.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Set Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Set an initial password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Create Customer
                      </Button>
                    </form>
                  </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Existing Customers</CardTitle>
                <CardDescription>A list of all customers you have created.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[40vh] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50">
                          <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="text-right w-[100px]">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {userProfiles.length > 0 ? (
                              userProfiles.map((profile) => (
                                  <TableRow key={profile.id}>
                                      <TableCell className="font-medium">{profile.name}</TableCell>
                                      <TableCell>{profile.email}</TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setProfileToDelete(profile)}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="h-24 text-center">
                                      No customers found. Create one to get started.
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </DashboardLayout>

      <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the profile for <span className="font-bold">{profileToDelete?.name}</span> and all of their associated delivery data and invoices. This will also delete their login account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive hover:bg-destructive/90">
              Yes, delete profile
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
