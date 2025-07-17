
"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, LogOut, PanelLeft, Search, Users, Tags, FileSpreadsheet, UserPlus, CreditCard } from "lucide-react";

const navItems = [
  { href: "/", label: "Data", icon: LayoutDashboard },
  { href: "/search-data", label: "Search Data", icon: Search },
  { href: "/add-user", label: "Add User", icon: UserPlus },
  { href: "/manage-users", label: "Manage Users", icon: Users },
  { href: "/invoice", label: "Create Invoice", icon: FileText },
  { href: "/invoices", label: "Search Invoices", icon: FileText },
  { href: "/manage-rates", label: "Manage Rates", icon: Tags },
  { href: "/users-sheet", label: "Users Sheet", icon: FileSpreadsheet },
  { href: "/manage-payments", label: "Manage Payments", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, user } = useContext(AppContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-2">
        <div className="flex h-[60px] items-center border-b border-sidebar-border px-6">
            <Link className="flex items-center gap-2 font-semibold font-headline text-lg" href="/">
                <svg width="150" height="70" viewBox="0 0 170 80" className="text-sidebar-primary">
                    <circle cx="40" cy="40" r="35" fill="currentColor"/>
                    <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--sidebar-primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
                    <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="currentColor"/>
                    <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="35" fill="hsl(var(--sidebar-foreground))" dy=".3em">waters</text>
                    <text x="115" y="68" fontFamily="sans-serif" fontSize="12" fill="hsl(var(--sidebar-foreground))" dy=".3em">FIT TO LIVE</text>
                </svg>
            </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
                {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-primary hover:bg-sidebar-accent",
                    pathname === item.href && "bg-sidebar-accent text-sidebar-primary"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
                ))}
            </nav>
        </div>
    </div>
  );


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar lg:block">
        {sidebarContent}
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation links for the application.</SheetDescription>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/100x100" data-ai-hint="profile avatar" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email || 'Admin Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
