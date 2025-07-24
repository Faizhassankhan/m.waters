
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Loader2 } from "lucide-react";

const ADMIN_ROUTES = ["/", "/add-user", "/invoice", "/invoices", "/manage-rates", "/search-data", "/users-sheet", "/manage-users", "/manage-payments", "/customer-payments", "/customer-feedbacks", "/login-info"];
const CUSTOMER_ROUTES = ["/customer-dashboard", "/bill-status"];
const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Don't run auth logic until the initial session check is complete
    if (loading) return;

    const userType = user?.user_metadata?.user_type;

    // If the user is logged in
    if (user) {
        // If they are on a public route, redirect them to their dashboard
        if (isPublicRoute) {
            if (userType === 'admin') {
                router.push("/");
            } else {
                router.push("/customer-dashboard");
            }
            return;
        }

        // Role-based route protection for private routes
        if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
             router.push("/");
        } else if (userType === 'customer' && ADMIN_ROUTES.includes(pathname)) {
            router.push("/customer-dashboard");
        }
    } 
    // If the user is not logged in and not on a public route, redirect to login
    else if (!isPublicRoute) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  // Show a loading screen ONLY for private routes while the session is being checked.
  // Public routes will render immediately.
  if (loading && !isPublicRoute) {
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
