
"use client";

import { useRef, useState, useContext, useEffect, useMemo } from "react";
import * as htmlToImage from 'html-to-image';
import { UserData, Delivery } from "@/lib/types";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share2, Loader2, Save, X, Pencil, Trash2 } from "lucide-react";
import { format, parse, getYear, getMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserDataPreviewProps {
  user: UserData | null;
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function UserDataPreview({ user: initialUser }: UserDataPreviewProps) {
  const dataCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<string, string>>({});
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  const { updateUserDelivery, deleteUserDelivery } = useContext(AppContext);
  const { toast } = useToast();

  useEffect(() => {
    setUser(initialUser);
    if (initialUser && initialUser.deliveries.length > 0) {
        // Default to the most recent month/year with data
        const lastDelivery = initialUser.deliveries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const lastDeliveryDate = new Date(lastDelivery.date);
        setSelectedMonth(getMonth(lastDeliveryDate));
        setSelectedYear(getYear(lastDeliveryDate));
    } else {
        setSelectedMonth(null);
        setSelectedYear(null);
    }

    if (initialUser && (!initialUser.deliveries || initialUser.deliveries.length === 0)) {
        setIsEditing(false);
    }
  }, [initialUser]);

  const availableYears = useMemo(() => {
    if (!user) return [];
    const years = new Set(user.deliveries.map(d => getYear(new Date(d.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [user]);

  const filteredDeliveries = useMemo(() => {
    if (!user) return [];
    if (selectedYear === null || selectedMonth === null) return user.deliveries;
    return user.deliveries.filter(d => {
        const deliveryDate = new Date(d.date);
        return getYear(deliveryDate) === selectedYear && getMonth(deliveryDate) === selectedMonth;
    });
  }, [user, selectedMonth, selectedYear]);

  const handleShare = async () => {
    if (!dataCardRef.current || !user || isEditing) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(dataCardRef.current, { 
        quality: 0.95,
        backgroundColor: 'hsl(var(--background))', 
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = selectedMonth !== null && selectedYear !== null 
        ? `delivery-report-${user.name}-${months[selectedMonth]}-${selectedYear}.png`
        : `delivery-report-${user.name}.png`;
      const file = new File([blob], fileName, { type: blob.type });

      const shareData = {
        files: [file],
        title: `Delivery Report for ${user.name}`,
        text: `Here is the delivery report for ${user.name}.`,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.click();
        toast({
          title: "Image downloaded",
          description: "Your browser doesn't support direct sharing. The report image has been downloaded for you to share manually.",
        });
      }

    } catch (error) {
      console.error('oops, something went wrong!', error);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not generate report image. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDateChange = (deliveryId: string, newDate: string) => {
    setDeliveryUpdates(prev => ({ ...prev, [deliveryId]: newDate }));
  };
  
  const confirmDelete = () => {
    if (!user || !deliveryToDelete) return;
    deleteUserDelivery(user.name, deliveryToDelete.id);
    
    const updatedUser = { ...user, deliveries: user.deliveries.filter(d => d.id !== deliveryToDelete.id) };
    setUser(updatedUser);

    toast({
        title: "Delivery Deleted",
        description: `The delivery on ${format(new Date(deliveryToDelete.date), "MMM dd")} has been removed.`
    });
    setDeliveryToDelete(null);
  }

  const saveChanges = () => {
    if (!user) return;
    try {
        let userToUpdate = user;
        Object.entries(deliveryUpdates).forEach(([deliveryId, newDateStr]) => {
            const parsedDate = parse(newDateStr, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Invalid date format for one of the entries. Please use YYYY-MM-DD.`);
            }
            updateUserDelivery(user.name, deliveryId, newDateStr);

            // Update local state for immediate feedback
            const updatedDeliveries = userToUpdate.deliveries.map(d => {
                if (d.id === deliveryId) {
                    return { ...d, date: newDateStr };
                }
                return d;
            });
            userToUpdate = { ...userToUpdate, deliveries: updatedDeliveries };
        });

        setUser(userToUpdate);

        toast({
            title: "Changes Saved",
            description: "Delivery dates have been successfully updated.",
        });
        setDeliveryUpdates({});
        setIsEditing(false);
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: e.message || "Could not save changes.",
        });
    }
  };


  if (!user) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <div className="text-center text-muted-foreground">
          <p>No user data to display.</p>
        </div>
      </Card>
    );
  }
  
  const reportTitle = selectedMonth !== null && selectedYear !== null 
    ? `DELIVERY REPORT - ${months[selectedMonth].toUpperCase()} ${selectedYear}`
    : "DELIVERY REPORT";

  return (
    <AlertDialog>
      <div className="flex flex-col h-full">
        <div ref={dataCardRef} className="bg-background p-4 flex-grow">
          <Card style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)' }} className="animate-in fade-in-50 bg-white text-card-foreground">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <CardTitle className="font-headline text-3xl flex items-baseline">
                          M
                          <svg
                            viewBox="0 0 24 24"
                            className="h-2 w-2 mx-px inline-block align-baseline"
                            style={{ fill: 'hsl(var(--primary-foreground))', transform: 'rotate(180deg)' }}
                          >
                            <path d="M12 2c5.523 0 10 4.477 10 10 0 5.523-10 12-10 12s-10-6.477-10-12c0-5.523 4.477-10 10-10z" />
                          </svg>
                          Waters
                      </CardTitle>
                  </div>
                  <div className="text-right">
                      <p className="font-semibold">{reportTitle}</p>
                      <p className="text-sm text-primary-foreground/80">{format(new Date(), "MMMM dd, yyyy")}</p>
                  </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">REPORT FOR</p>
                <p className="font-semibold text-xl">{user.name}</p>
              </div>
              
              <ScrollArea className="max-h-[40vh] pr-4">
                  {filteredDeliveries.length > 0 ? (
                      <div className="space-y-6">
                          <div className="rounded-md border">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead className="text-right">Bottles</TableHead>
                                          {isEditing && <TableHead className="w-[50px] text-right">Actions</TableHead>}
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredDeliveries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => (
                                          <TableRow key={d.id}>
                                              <TableCell>
                                                  {isEditing ? (
                                                      <Input 
                                                          type="date" 
                                                          className="h-8 w-auto"
                                                          value={deliveryUpdates[d.id] ?? d.date}
                                                          onChange={(e) => handleDateChange(d.id, e.target.value)}
                                                      />
                                                  ) : (
                                                      format(new Date(d.date), 'EEEE, MMM dd')
                                                  )}
                                              </TableCell>
                                              <TableCell className="text-right font-medium">{d.bottles}</TableCell>
                                              {isEditing && (
                                                  <TableCell className="text-right">
                                                      <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeliveryToDelete(d)}>
                                                              <Trash2 className="h-4 w-4" />
                                                          </Button>
                                                      </AlertDialogTrigger>
                                                  </TableCell>
                                              )}
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                        No deliveries found for the selected period.
                    </div>
                  )}
              </ScrollArea>
              
              <Separator className="my-6" />

              <div className="flex justify-end items-center text-right">
                  <div>
                      <p className="text-sm text-muted-foreground">TOTAL BOTTLES (IN PERIOD)</p>
                      <p className="font-bold text-3xl font-headline text-primary">{filteredDeliveries.reduce((sum, d) => sum + d.bottles, 0)}</p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <CardFooter className="p-6 pt-4 bg-background rounded-b-lg flex-col items-start gap-4">
            <div className="w-full">
                <Label className="text-xs text-muted-foreground">Filter Report</Label>
                <div className="flex w-full gap-2 mt-1">
                    <Select onValueChange={(v) => setSelectedMonth(Number(v))} value={String(selectedMonth ?? -1)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={(v) => setSelectedYear(Number(v))} value={String(selectedYear ?? -1)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Separator className="w-full" />
            <div className="flex w-full items-center justify-between gap-4">
               <div className="flex items-center space-x-2">
                  <Switch id="edit-mode" checked={isEditing} onCheckedChange={setIsEditing} disabled={!user.deliveries || user.deliveries.length === 0} />
                  <Label htmlFor="edit-mode" className="flex items-center gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" /> Edit
                  </Label>
               </div>
               {isEditing ? (
                  <div className="flex gap-2">
                      <Button onClick={() => { setIsEditing(false); setDeliveryUpdates({}); }} variant="ghost" size="sm">
                          <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                      <Button onClick={saveChanges} size="sm">
                          <Save className="mr-2 h-4 w-4" /> Save Changes
                      </Button>
                  </div>
               ) : (
                  <Button onClick={handleShare} className="w-full max-w-xs" disabled={isSharing}>
                      {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
                      {isSharing ? 'Generating Image...' : 'Share Report as Image'}
                  </Button>
               )}
            </div>
        </CardFooter>
      </div>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                  This will permanently delete the delivery of <span className="font-bold">{deliveryToDelete?.bottles} bottles</span> on <span className="font-bold">{deliveryToDelete ? format(new Date(deliveryToDelete.date), "MMMM dd, yyyy") : ""}</span> for <span className="font-bold">{user?.name}</span>. This action cannot be undone.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeliveryToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    