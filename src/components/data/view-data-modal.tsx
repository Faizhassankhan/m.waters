
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
          <UserDataPreview user={user} />
      </DialogContent>
    </Dialog>
  );
}
