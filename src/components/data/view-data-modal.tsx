"use client";

import { UserData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Bot, Share2 } from "lucide-react";

interface ViewDataModalProps {
  user: UserData | null;
  onClose: () => void;
}

export function ViewDataModal({ user, onClose }: ViewDataModalProps) {
  if (!user) return null;

  const groupedByMonth = user.deliveries.reduce((acc, delivery) => {
    const monthYear = format(new Date(delivery.date), "MMMM yyyy");
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(delivery);
    return acc;
  }, {} as Record<string, typeof user.deliveries>);

  const handleShare = () => {
    let message = `*M.Waters Delivery Report for ${user.name}*\n\n`;
    Object.entries(groupedByMonth).forEach(([month, deliveries]) => {
      message += `*${month}*\n`;
      let totalBottles = 0;
      deliveries.forEach(d => {
        message += `- ${format(new Date(d.date), 'MMM dd')}: ${d.bottles} bottles\n`;
        totalBottles += d.bottles;
      });
      message += `_Total for ${month}: ${totalBottles} bottles_\n\n`;
    });
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{user.name}'s Data</DialogTitle>
          <DialogDescription>
            Complete delivery history for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
            {Object.entries(groupedByMonth).map(([month, deliveries]) => (
                <div key={month}>
                <h3 className="font-semibold text-lg mb-2">{month}</h3>
                <div className="space-y-1 text-sm">
                    {deliveries.map(d => (
                    <div key={d.id} className="flex justify-between">
                        <span>{format(new Date(d.date), 'EEEE, MMMM do')}</span>
                        <span className="font-medium">{d.bottles} bottles</span>
                    </div>
                    ))}
                </div>
                <Separator className="my-3"/>
                <div className="flex justify-end font-bold">
                    <span>Total: {deliveries.reduce((sum, d) => sum + d.bottles, 0)} bottles</span>
                </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
