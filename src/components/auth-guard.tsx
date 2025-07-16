
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Loader2 } from "lucide-react";

const ADMIN_ROUTES = ["/", "/add-user", "/invoice", "/invoices", "/manage-rates", "/search-data", "/users-sheet"];
const CUSTOMER_ROUTES = ["/customer-dashboard"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, customer, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const userType = user?.user_metadata?.user_type;

    // If not logged in, redirect to login page
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }
    
    if (user) {
        // If logged in, but on the login page, redirect away
        if (pathname === "/login") {
            if (userType === 'customer') {
                router.push("/customer-dashboard");
            } else {
                router.push("/");
            }
            return;
        }

        // Route protection
        if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
             router.push("/");
        } else if (userType === 'customer' && ADMIN_ROUTES.includes(pathname)) {
            router.push("/customer-dashboard");
        }
    }

  }, [user, customer, loading, router, pathname]);

  if (loading || (!user && pathname !== "/login")) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}

    