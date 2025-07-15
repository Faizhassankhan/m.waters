
"use client";

import { UserData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserDataPreview } from "./user-data-preview";

interface ViewDataModalProps {
  user: UserData | null;
  onClose: () => void;
}

export function ViewDataModal({ user, onClose }: ViewDataModalProps) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>User Data for {user.name}</DialogTitle>
            <DialogDescription>A detailed view of the user's delivery history, ready for sharing.</DialogDescription>
          </DialogHeader>
          <UserDataPreview user={user} />
      </DialogContent>
    </Dialog>
  );
}
