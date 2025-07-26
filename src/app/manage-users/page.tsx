
"use client";
import AuthGuard from "@/components/auth-guard";

// This page is deprecated and its functionality has been moved to the
// "Manage Customers" tab on the "Add User" page.
// We are keeping the file to avoid 404 errors if a user has it bookmarked,
// but it will simply redirect.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function DeprecatedManageUsersPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/add-user');
    }, [router]);

    return (
         <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Redirecting to Manage Customers...</p>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <DeprecatedManageUsersPage />
        </AuthGuard>
    )
}

    