
"use client";

import { useRef, useState, useContext, useEffect, useMemo } from "react";
import * as htmlToImage from 'html-to-image';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { UserProfile, Delivery } from "@/lib/types";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share2, Loader2, Save, X, Pencil, Trash2, RefreshCw, ClipboardX, FileText, ImageIcon } from "lucide-react";
import { format, parse, getYear, getMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface UserDataPreviewProps {
  profile: UserProfile | null;
  onRefresh: () => void;
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function UserDataPreview({ profile: initialProfile, onRefresh }: UserDataPreviewProps) {
  const dataCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<string, string>>({});
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  const { updateUserDelivery, deleteUserDelivery, removeDuplicateDeliveries } = useContext(AppContext);
  const { toast } = useToast();

  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile && initialProfile.deliveries.length > 0) {
        const lastDelivery = [...initialProfile.deliveries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const lastDeliveryDate = new Date(lastDelivery.date);
        setSelectedMonth(getMonth(lastDeliveryDate));
        setSelectedYear(getYear(lastDeliveryDate));
    } else {
        setSelectedMonth(null);
        setSelectedYear(null);
    }

    if (initialProfile && (!initialProfile.deliveries || initialProfile.deliveries.length === 0)) {
        setIsEditing(false);
    }
  }, [initialProfile]);

  const availableYears = useMemo(() => {
    if (!profile) return [];
    const years = new Set(profile.deliveries.map(d => getYear(new Date(d.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [profile]);

  const filteredDeliveries = useMemo(() => {
    if (!profile) return [];
    if (selectedYear === null || selectedMonth === null) return profile.deliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return profile.deliveries.filter(d => {
        const deliveryDate = new Date(d.date);
        return getYear(deliveryDate) === selectedYear && getMonth(deliveryDate) === selectedMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [profile, selectedMonth, selectedYear]);

  const handleShareImage = async () => {
    if (!dataCardRef.current || !profile || isEditing) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(dataCardRef.current, { 
        quality: 0.95,
        backgroundColor: 'hsl(var(--background))', 
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = selectedMonth !== null && selectedYear !== null 
        ? `delivery-report-${profile.name}-${months[selectedMonth]}-${selectedYear}.png`
        : `delivery-report-${profile.name}.png`;
      const file = new File([blob], fileName, { type: blob.type });

      const shareData = {
        files: [file],
        title: `Delivery Report for ${profile.name}`,
        text: `Here is the delivery report for ${profile.name}.`,
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

  const handleSharePdf = async () => {
    if (!profile) return;
    setIsSharing(true);

    try {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("m.waters", 14, 22);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("FIT TO LIVE", 16, 28);
        
        doc.setFontSize(16);
        doc.text("DELIVERY REPORT", 205, 22, { align: "right" });
        
        // Sub-header
        doc.setLineWidth(0.5);
        doc.line(14, 35, 205, 35);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("REPORT FOR", 14, 42);
        doc.text("PERIOD", 205, 42, { align: "right" });
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(profile.name, 14, 48);
        doc.setFont("helvetica", "normal");
        const period = selectedMonth !== null && selectedYear !== null 
            ? `${months[selectedMonth]}, ${selectedYear}`
            : "All Time";
        doc.text(period, 205, 48, { align: "right" });
        
        doc.line(14, 55, 205, 55);

        // Table
        if (filteredDeliveries.length > 0) {
            autoTable(doc, {
                startY: 62,
                head: [['Date', 'Bottles']],
                body: filteredDeliveries.map(d => [format(new Date(d.date), 'EEEE, MMMM dd, yyyy'), d.bottles]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
        } else {
             doc.text("No deliveries found for the selected period.", 14, 70);
        }

        const finalY = (doc as any).lastAutoTable.finalY || 70;
        
        // Summary
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const totalBottles = filteredDeliveries.reduce((sum, d) => sum + d.bottles, 0);
        doc.text(`Total Bottles Delivered: ${totalBottles}`, 205, finalY + 15, { align: "right" });

        const pdfBlob = doc.output('blob');
        const fileName = `report-${profile.name}-${period}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Delivery Report for ${profile.name}`, text: `Here is the delivery report for ${profile.name}.` });
        } else {
            doc.save(fileName);
            toast({ title: "PDF Downloaded", description: "The report PDF has been downloaded." });
        }

    } catch (error) {
        console.error('PDF generation failed', error);
        toast({ variant: "destructive", title: "PDF Failed", description: "Could not generate report PDF." });
    } finally {
        setIsSharing(false);
    }
  };

  const handleDateChange = (deliveryId: string, newDate: string) => {
    setDeliveryUpdates(prev => ({ ...prev, [deliveryId]: newDate }));
  };
  
  const confirmDelete = async () => {
    if (!profile || !deliveryToDelete) return;
    try {
        await deleteUserDelivery(profile.id, deliveryToDelete.id);
        toast({
            title: "Delivery Deleted",
            description: `The delivery on ${format(new Date(deliveryToDelete.date), "MMM dd")} has been removed.`
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || "Could not delete delivery."
        });
    } finally {
        setDeliveryToDelete(null);
    }
  }

  const handleRemoveDuplicates = async () => {
    if (!profile) return;
    try {
      await removeDuplicateDeliveries(profile.id);
      toast({
          title: "Duplicates Removed",
          description: `Duplicate delivery entries for ${profile.name} have been removed.`,
      });
    } catch(error: any) {
       toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error.message || "Could not remove duplicates.",
        });
    }
  }

  const saveChanges = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
        const updatePromises = Object.entries(deliveryUpdates).map(([deliveryId, newDateStr]) => {
            const parsedDate = parse(newDateStr, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Invalid date format for one of the entries. Please use YYYY-MM-DD.`);
            }
            return updateUserDelivery(profile.id, deliveryId, newDateStr);
        });

        await Promise.all(updatePromises);
        
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
    } finally {
        setIsSaving(false);
    }
  };


  if (!profile) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <div className="text-center text-muted-foreground">
          <p>Search for a profile to see its data.</p>
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
                         <svg width="150" height="70" viewBox="0 0 170 80" className="-ml-4">
                            <circle cx="40" cy="40" r="35" fill="#ECF0F1" stroke="#34495E" strokeWidth="2" />
                            <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="#34495E" textAnchor="middle" dominantBaseline="central">m</text>
                            <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="#ECF0F1"/>
                            <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="30" fill="#ECF0F1" dy=".3em">waters</text>
                            <text x="115" y="68" fontFamily="sans-serif" fontSize="10" fill="#ECF0F1" dy=".3em">FIT TO LIVE</text>
                        </svg>
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
                <p className="font-semibold text-xl">{profile.name}</p>
              </div>
              
              <ScrollArea className="h-[40vh] pr-4">
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
                                      {filteredDeliveries.map(d => (
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
                    <Select onValueChange={(v) => setSelectedMonth(Number(v))} value={selectedMonth !== null ? String(selectedMonth) : undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={(v) => setSelectedYear(Number(v))} value={selectedYear !== null ? String(selectedYear) : undefined}>
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
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={handleRemoveDuplicates} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <ClipboardX className="mr-2 h-4 w-4" /> Delete Duplicates
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Input type="checkbox" id="edit-mode" checked={isEditing} onChange={(e) => setIsEditing(e.target.checked)} disabled={!profile.deliveries || profile.deliveries.length === 0} className="h-4 w-4 cursor-pointer"/>
                  <Label htmlFor="edit-mode" className="flex items-center gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" /> Edit
                  </Label>
               </div>
            </div>

            <Separator className="w-full" />
            
            {isEditing ? (
                <div className="flex w-full gap-2">
                    <Button onClick={() => { setIsEditing(false); setDeliveryUpdates({}); }} variant="ghost" className="w-full">
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={saveChanges} className="w-full" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                         Save Changes
                    </Button>
                </div>
            ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full" disabled={isSharing}>
                      {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
                      {isSharing ? 'Generating...' : 'Share Report'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={handleSharePdf}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Share as PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareImage}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Share as Image</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            )}

        </CardFooter>
      </div>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                  This will permanently delete the delivery of <span className="font-bold">{deliveryToDelete?.bottles} bottles</span> on <span className="font-bold">{deliveryToDelete ? format(new Date(deliveryToDelete.date), "MMMM dd, yyyy") : ""}</span> for <span className="font-bold">{profile?.name}</span>. This action cannot be undone.
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
