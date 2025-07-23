
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { UserProfile } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";

interface ProcessedRow {
  type: "month-header" | "user-data";
  content: string | UserProfile;
  deliveries?: string;
  month?: string;
}

export function DataTable({ data }: { data: UserProfile[] }) {
  const router = useRouter();
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const processedData = useMemo(() => {
    const groupedByMonth: Record<string, UserProfile[]> = {};
    data.forEach(profile => {
      (profile.deliveries || []).forEach(delivery => {
        const monthYear = format(new Date(delivery.date), "MMMM yyyy");
        if (!groupedByMonth[monthYear]) {
          groupedByMonth[monthYear] = [];
        }
        // Ensure a user is only added once per month group
        if (!groupedByMonth[monthYear].some(p => p.id === profile.id)) {
            const monthDeliveries = profile.deliveries.filter(d => format(new Date(d.date), "MMMM yyyy") === monthYear) || [];
            groupedByMonth[monthYear].push({ ...profile, deliveries: monthDeliveries });
        }
      });
    });

    const sortedMonths = Object.keys(groupedByMonth).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

    return sortedMonths.flatMap(month => {
        const profilesInMonth = groupedByMonth[month].sort((a, b) => a.name.localeCompare(b.name));
        const rows: ProcessedRow[] = [
            { type: "month-header", content: month }
        ];

        profilesInMonth.forEach(profile => {
            const deliveriesString = profile.deliveries.map(d => `${format(new Date(d.date), 'MMM dd')}: ${d.bottles} bottles`).join(', ');
            rows.push({
                type: 'user-data',
                content: profile,
                deliveries: deliveriesString,
                month: month,
            });
        });
        return rows;
    });
  }, [data]);
  
  // Initialize all months to be collapsed
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    processedData.forEach(row => {
        if (row.type === 'month-header') {
            initialExpandedState[row.content as string] = false;
        }
    });
    setExpandedMonths(initialExpandedState);
  }, [data]); // Re-run when data changes


  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({...prev, [month]: !prev[month]}));
  }

  const viewUserData = (profileName: string) => {
    router.push(`/search-data?q=${encodeURIComponent(profileName)}`);
  }

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No delivery data available.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Profile Name</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((row, index) => {
              if (row.type === "month-header") {
                const month = row.content as string;
                return (
                  <TableRow key={index} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={3} className="font-bold text-lg font-headline">
                      <button onClick={() => toggleMonth(month)} className="w-full flex justify-between items-center">
                        {month}
                        {expandedMonths[month] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              }
              const profile = row.content as UserProfile;
              const month = row.month as string;
              if (expandedMonths[month]) {
                 return (
                    <TableRow key={`${profile.id}-${month}`}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{row.deliveries}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => viewUserData(profile.name)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Full Data</span>
                        </Button>
                        </TableCell>
                    </TableRow>
                );
              }
              return null;
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
