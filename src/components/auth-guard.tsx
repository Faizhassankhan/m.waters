"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated && pathname !== "/login") {
    // You can render a loading spinner here while redirecting
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-2xl font-headline">Redirecting to login...</div>
        </div>
    );
  }

  return <>{children}</>;
}
