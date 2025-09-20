
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import LoadingIndicator from "@/components/loading-indicator";

const ADMIN_DASHBOARD_ROUTE = "/dashboard";
const ADMIN_ROUTES = ["/dashboard", "/add-user", "/invoice", "/invoices", "/manage-rates", "/manage-deposits", "/search-data", "/users-sheet", "/manage-users", "/manage-payments", "/customer-payments", "/customer-feedbacks", "/login-info"];
const CUSTOMER_ROUTES = ["/customer-dashboard", "/bill-status"];
const PUBLIC_ROUTES = ["/login", "/register", "/landing", "/"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = !PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Don't run auth logic until the initial session check is complete
    if (loading) return;

    const userType = user?.user_metadata?.user_type;

    // If the user is logged in
    if (user) {
      // Role-based protection: if a logged-in user tries to access a route not meant for them, redirect.
      if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
        router.push(ADMIN_DASHBOARD_ROUTE);
      } else if (userType === 'customer' && (ADMIN_ROUTES.includes(pathname) || pathname === ADMIN_DASHBOARD_ROUTE)) {
        router.push("/customer-dashboard");
      }
    }
    // If the user is not logged in and is trying to access a protected route
    else if (isProtectedRoute) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isProtectedRoute]);

  // Show a loading screen for all routes while the session is being checked.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingIndicator />
      </div>
    );
  }
  
  // If a logged-in user is trying to access a protected route but their role is wrong,
  // show a loading screen while redirecting.
  if (user && isProtectedRoute) {
      const userType = user?.user_metadata?.user_type;
      if (userType === 'admin' && CUSTOMER_ROUTES.includes(pathname)) {
         return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
      }
      if (userType === 'customer' && (ADMIN_ROUTES.includes(pathname) || pathname === ADMIN_DASHBOARD_ROUTE)) {
         return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
      }
  }

  // If a user is NOT logged in and trying to access a protected page, show loading while redirecting to /login
  if (!loading && !user && isProtectedRoute) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
  }

  return <>{children}</>;
}
