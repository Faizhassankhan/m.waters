
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

function DataManagementPage() {
  const { dataProfiles, refreshData } = useContext(AppContext);
  const [searchMonth, setSearchMonth] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredDataProfiles = useMemo(() => {
    if (!searchMonth) {
      return dataProfiles;
    }
    const lowercasedMonth = searchMonth.toLowerCase();
    return dataProfiles
      .map((profile) => {
        const matchingDeliveries = profile.deliveries.filter((d) =>
          d.month.toLowerCase().includes(lowercasedMonth)
        );
        return { ...profile, deliveries: matchingDeliveries };
      })
      .filter((profile) => profile.deliveries.length > 0);
  }, [dataProfiles, searchMonth]);

  const handleSave = () => {
      refreshData();
      // Optional: keep form open if user wants to add more data quickly
      // setShowAddForm(false); 
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Data Management
          </h2>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {showAddForm ? "Close Form" : "Add New Data"}
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Add New Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <AddDataForm onSave={handleSave} />
            </CardContent>
          </Card>
        )}

        <Card>
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
            <DataTable data={filteredDataProfiles} />
          </CardContent>
        </Card>
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
