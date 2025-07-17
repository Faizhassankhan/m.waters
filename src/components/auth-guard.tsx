
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Loader2 } from "lucide-react";

const ADMIN_ROUTES = ["/", "/add-user", "/invoice", "/invoices", "/manage-rates", "/search-data", "/users-sheet", "/manage-users", "/mark-payments"];
const CUSTOMER_ROUTES = ["/customer-dashboard", "/bill-status"];
const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const userType = user?.user_metadata?.user_type;

    // If not logged in and not on a public route, redirect to login
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }
    
    // If logged in
    if (user) {
        // If on a public route, redirect away
        if (isPublicRoute) {
            if (userType === 'customer') {
                router.push("/customer-dashboard");
            } else {
                router.push("/");
            }
            return;
        }

        // Role-based route protection
        if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
             router.push("/");
        } else if (userType === 'customer' && ADMIN_ROUTES.includes(pathname)) {
            router.push("/customer-dashboard");
        }
    }

  }, [user, loading, router, pathname]);

  // Show loader while checking auth state or if redirecting
  if (loading || (!user && !PUBLIC_ROUTES.includes(pathname))) {
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

    
