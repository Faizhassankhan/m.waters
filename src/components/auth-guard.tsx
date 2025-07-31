
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import LoadingIndicator from "@/components/loading-indicator";

const ADMIN_DASHBOARD_ROUTE = "/dashboard";
const ADMIN_ROUTES = ["/dashboard", "/add-user", "/invoice", "/invoices", "/manage-rates", "/search-data", "/users-sheet", "/manage-users", "/manage-payments", "/customer-payments", "/customer-feedbacks", "/login-info"];
const CUSTOMER_ROUTES = ["/customer-dashboard", "/bill-status"];
const PUBLIC_ROUTES = ["/login", "/register", "/landing"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isRootRoute = pathname === "/";

  useEffect(() => {
    // Don't run auth logic until the initial session check is complete
    if (loading) return;

    const userType = user?.user_metadata?.user_type;

    // If the user is logged in
    if (user) {
      // If they are on a public route (like /login) or the root landing page, redirect them to their dashboard
      if (isPublicRoute || isRootRoute) {
        if (userType === 'admin') {
          router.push(ADMIN_DASHBOARD_ROUTE);
        } else {
          router.push("/customer-dashboard");
        }
        return;
      }

      // Role-based route protection for private routes
      if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
        router.push(ADMIN_DASHBOARD_ROUTE);
      } else if (userType === 'customer' && (ADMIN_ROUTES.includes(pathname) || pathname === ADMIN_DASHBOARD_ROUTE)) {
        router.push("/customer-dashboard");
      }
    }
    // If the user is not logged in and is trying to access a private route
    else if (!isPublicRoute && !isRootRoute) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isPublicRoute, isRootRoute]);

  // Show a loading screen for all routes while the session is being checked.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingIndicator />
      </div>
    );
  }

  // If a logged-in user is trying to access the root page, they will be redirected.
  // We can show a loading indicator or null while that happens.
  if (user && isRootRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingIndicator />
      </div>
    );
  }

  return <>{children}</>;
}
