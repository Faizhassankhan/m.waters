
"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import LoadingIndicator from "@/components/loading-indicator";

const ADMIN_DASHBOARD_ROUTE = "/dashboard";
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_ROUTES = ["/dashboard", "/add-user", "/invoice", "/invoices", "/manage-rates", "/manage-deposits", "/search-data", "/users-sheet", "/manage-users", "/manage-payments", "/customer-payments", "/customer-feedbacks", "/login-info"];
const CUSTOMER_ROUTES = ["/customer-dashboard", "/bill-status"];
const PUBLIC_ROUTES = ["/login", "/register", "/landing", "/"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = !PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;

    const userType = user?.user_metadata?.user_type;
    const isAdminByEmail = user?.email === ADMIN_EMAIL;

    if (user) {
      if (isAdminByEmail) {
        if (CUSTOMER_ROUTES.includes(pathname)) {
          router.push(ADMIN_DASHBOARD_ROUTE);
        }
      } else if (userType === 'customer') {
        if (ADMIN_ROUTES.includes(pathname) || pathname === ADMIN_DASHBOARD_ROUTE) {
          router.push("/customer-dashboard");
        }
      }
    } else if (isProtectedRoute) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isProtectedRoute]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingIndicator />
      </div>
    );
  }
  
  if (user && isProtectedRoute) {
      const userType = user?.user_metadata?.user_type;
      const isAdminByEmail = user?.email === ADMIN_EMAIL;
      
      if (isAdminByEmail && CUSTOMER_ROUTES.includes(pathname)) {
         return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
      }
      if (userType === 'customer' && !isAdminByEmail && (ADMIN_ROUTES.includes(pathname) || pathname === ADMIN_DASHBOARD_ROUTE)) {
         return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
      }
  }

  if (!loading && !user && isProtectedRoute) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingIndicator /></div>;
  }

  return <>{children}</>;
}
