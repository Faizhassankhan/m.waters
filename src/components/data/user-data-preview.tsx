
"use client";

import { useRef, useState } from "react";
import * as htmlToImage from 'html-to-image';
import { UserData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface UserDataPreviewProps {
  user: UserData | null;
}

export function UserDataPreview({ user }: UserDataPreviewProps) {
  const dataCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!dataCardRef.current || !user) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(dataCardRef.current, { 
        quality: 0.95,
        backgroundColor: 'hsl(var(--background))', 
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `delivery-report-${user.name}.png`, { type: blob.type });

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
        link.download = `delivery-report-${user.name}.png`;
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

  if (!user) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <div className="text-center text-muted-foreground">
          <p>No user data to display.</p>
        </div>
      </Card>
    );
  }

  const groupedByMonth = user.deliveries.reduce((acc, delivery) => {
    const monthYear = format(new Date(delivery.date), "MMMM yyyy");
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(delivery);
    return acc;
  }, {} as Record<string, typeof user.deliveries>);

  return (
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
                    <p className="font-semibold">DELIVERY REPORT</p>
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
                <div className="space-y-6">
                {Object.entries(groupedByMonth).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([month, deliveries]) => (
                    <div key={month}>
                        <p className="text-sm text-muted-foreground mb-2">DELIVERIES FOR {month.toUpperCase()}</p>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Bottles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deliveries.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{format(new Date(d.date), 'EEEE, MMM dd')}</TableCell>
                                            <TableCell className="text-right font-medium">{d.bottles}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end items-center p-2 bg-muted/50 font-bold text-sm">
                                Total Bottles: {deliveries.reduce((sum, d) => sum + d.bottles, 0)}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
            
            <Separator className="my-6" />

            <div className="flex justify-end items-center text-right">
                <div>
                    <p className="text-sm text-muted-foreground">TOTAL BOTTLES (ALL TIME)</p>
                    <p className="font-bold text-3xl font-headline text-primary">{user.deliveries.reduce((sum, d) => sum + d.bottles, 0)}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <CardFooter className="p-6 pt-4 bg-background rounded-b-lg">
          <Button onClick={handleShare} className="w-full" disabled={isSharing}>
              {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
              {isSharing ? 'Generating Image...' : 'Share Report as Image'}
          </Button>
      </CardFooter>
    </div>
  );
}
