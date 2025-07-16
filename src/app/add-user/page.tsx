
"use client";

import { useContext, useState, useMemo } from "react";
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
import { Loader2, UserPlus, Trash2, Link2, Link, Unlink, UserCog } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataProfile, RegisteredUser } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

function AddUserPage() {
  const { 
    dataProfiles, 
    registeredUsers, 
    addDataProfile, 
    deleteDataProfile,
    linkProfileToUser,
    unlinkProfile,
  } = useContext(AppContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<DataProfile | null>(null);
  const [linkingProfile, setLinkingProfile] = useState<DataProfile | null>(null);
  const [selectedRegisteredUserId, setSelectedRegisteredUserId] = useState<string>('');
  
  const unlinkedRegisteredUsers = useMemo(() => {
    return registeredUsers.filter(ru => !dataProfiles.some(dp => dp.linked_user_id === ru.id))
  }, [registeredUsers, dataProfiles])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await addDataProfile(values.name);
      toast({
        title: "Success",
        description: `Data profile for "${values.name}" has been created.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Adding Profile",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProfile = async () => {
    if (profileToDelete) {
      try {
        await deleteDataProfile(profileToDelete.id);
        toast({
          title: "Profile Deleted",
          description: `Profile "${profileToDelete.name}" has been removed.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Deleting Profile",
          description: error.message || "An unexpected error occurred.",
        });
      } finally {
        setProfileToDelete(null);
      }
    }
  };

  const handleLinkUser = async () => {
    if (linkingProfile && selectedRegisteredUserId) {
        try {
            await linkProfileToUser(linkingProfile.id, selectedRegisteredUserId);
            toast({
                title: "Success",
                description: `Profile ${linkingProfile.name} linked to user.`
            });
        } catch(e: any) {
            toast({ variant: "destructive", title: "Linking failed", description: e.message });
        } finally {
            setLinkingProfile(null);
            setSelectedRegisteredUserId('');
        }
    }
  }

  const handleUnlinkUser = async (profileId: string) => {
    try {
      await unlinkProfile(profileId);
       toast({
        title: "Success",
        description: `Profile unlinked successfully.`
      });
    } catch(e: any) {
       toast({ variant: "destructive", title: "Unlinking failed", description: e.message });
    }
  }
  
  const getLinkedUserEmail = (userId: string | null) => {
    if (!userId) return null;
    return registeredUsers.find(ru => ru.id === userId)?.email;
  }

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
              Manage Users & Data Profiles
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><UserCog /> Data Profiles</CardTitle>
                <CardDescription>
                  Create and manage data profiles for your customers. These profiles hold the delivery data. Then, link them to a registered user's account to grant them access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card>
                  <CardHeader>
                      <CardTitle className="font-headline text-lg">Create New Data Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Profile Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Jane Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Create Profile
                          </Button>
                        </form>
                      </Form>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h3 className="font-semibold font-headline">Existing Profiles</h3>
                  <ScrollArea className="h-[40vh] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50">
                          <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Linked Account</TableHead>
                              <TableHead className="text-right w-[100px]">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {dataProfiles.length > 0 ? (
                              dataProfiles.map((profile) => (
                                  <TableRow key={profile.id}>
                                      <TableCell className="font-medium">{profile.name}</TableCell>
                                      <TableCell>
                                        {profile.linked_user_id ? (
                                          <div className="flex items-center gap-2 text-sm text-green-600">
                                            <Link className="h-4 w-4" />
                                            <span>{getLinkedUserEmail(profile.linked_user_id)}</span>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground italic">Not Linked</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                          {profile.linked_user_id ? (
                                            <Button variant="ghost" size="icon" title="Unlink" onClick={() => handleUnlinkUser(profile.id)}>
                                              <Unlink className="h-4 w-4 text-orange-500" />
                                            </Button>
                                          ) : (
                                            <Button variant="ghost" size="icon" title="Link Profile to a User" onClick={() => setLinkingProfile(profile)}>
                                              <Link2 className="h-4 w-4" />
                                            </Button>
                                          )}
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setProfileToDelete(profile)}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="h-24 text-center">
                                      No data profiles found. Create one to get started.
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Registered Users</CardTitle>
                <CardDescription>A list of all users who have registered on the website.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[70vh] rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registeredUsers.length > 0 ? (
                                registeredUsers.map((rUser) => (
                                    <TableRow key={rUser.id}>
                                        <TableCell className="font-medium">{rUser.email}</TableCell>
                                        <TableCell>
                                            {dataProfiles.some(dp => dp.linked_user_id === rUser.id) ? (
                                                <span className="text-sm text-green-600 font-semibold">Linked</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Unlinked</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No users have registered yet.
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
              This will permanently delete the data profile for <span className="font-bold">{profileToDelete?.name}</span> and all of their associated delivery data. This action cannot be undone.
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

      <AlertDialog open={!!linkingProfile} onOpenChange={() => {setLinkingProfile(null); setSelectedRegisteredUserId('');}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link Profile to User</AlertDialogTitle>
            <AlertDialogDescription>
                Select a registered user to link to the <span className="font-bold">{linkingProfile?.name}</span> data profile. This will grant them access to view this profile's data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
              <Select onValueChange={setSelectedRegisteredUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a registered user" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedRegisteredUsers.map(ru => (
                    <SelectItem key={ru.id} value={ru.id}>{ru.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLinkUser} disabled={!selectedRegisteredUserId}>
              Link User
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
