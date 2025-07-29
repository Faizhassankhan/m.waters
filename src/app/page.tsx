
"use client";

import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AddDataForm } from "@/components/data/add-data-form";
import { DataTable } from "@/components/data/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import ProfileCard from "@/components/profile-card";
import "@/components/profile-card.css";


function DataManagementPage() {
  const { userProfiles, user } = useContext(AppContext);
  const [searchMonth, setSearchMonth] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredDataProfiles = useMemo(() => {
    if (!searchMonth) {
      return userProfiles;
    }
    const lowercasedMonth = searchMonth.toLowerCase();
    return userProfiles
      .map((profile) => {
        // Guard against profile.deliveries being null or undefined
        if (!profile.deliveries) {
          return { ...profile, deliveries: [] };
        }
        const matchingDeliveries = profile.deliveries.filter((d) => {
          // Safely get the month name from the date property
          const deliveryMonth = format(new Date(d.date), "MMMM");
          return deliveryMonth.toLowerCase().includes(lowercasedMonth);
        });
        return { ...profile, deliveries: matchingDeliveries };
      })
      .filter((profile) => profile.deliveries.length > 0);
  }, [userProfiles, searchMonth]);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Dashboard
          </h2>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {showAddForm ? "Close Form" : "Add New Data"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle className="font-headline flex justify-between items-center">
                  <span>Delivery Records</span>
                   <div className="w-full max-w-sm">
                    <Input
                      placeholder="Filter by month (e.g., January)"
                      value={searchMonth}
                      onChange={(e) => setSearchMonth(e.target.value)}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAddForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="font-headline text-xl">Add New Delivery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AddDataForm />
                    </CardContent>
                  </Card>
                )}
                <DataTable data={filteredDataProfiles} />
              </CardContent>
            </Card>

            <div className="col-span-1 lg:col-span-3">
               <div className="flex items-center justify-center h-full">
                 <ProfileCard
                    name="Admin"
                    title="AquaManager"
                    handle={user?.email?.split('@')[0] || 'admin'}
                    status="Online"
                    contactText="Contact"
                    avatarUrl="https://placehold.co/400x400.png"
                    data-ai-hint="water glass"
                    showUserInfo={true}
                    enableTilt={true}
                  />
               </div>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <DataManagementPage />
    </AuthGuard>
  );
}
