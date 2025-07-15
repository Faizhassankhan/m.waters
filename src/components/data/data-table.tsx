"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { UserData } from "@/lib/types";
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
import { ViewDataModal } from "./view-data-modal";

interface ProcessedRow {
  type: "month-header" | "user-data";
  content: string | UserData;
  deliveries?: string;
  month?: string;
}

export function DataTable({ data }: { data: UserData[] }) {
  const [modalUser, setModalUser] = useState<UserData | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const processedData = useMemo(() => {
    const groupedByMonth: Record<string, UserData[]> = {};
    data.forEach(user => {
      user.deliveries.forEach(delivery => {
        const monthYear = format(new Date(delivery.date), "MMMM yyyy");
        if (!groupedByMonth[monthYear]) {
          groupedByMonth[monthYear] = [];
        }
        // Avoid adding the same user multiple times per month
        if (!groupedByMonth[monthYear].find(u => u.name === user.name)) {
             // We only want deliveries for the current month for this user view
            const monthDeliveries = data.find(u => u.name === user.name)?.deliveries.filter(d => format(new Date(d.date), "MMMM yyyy") === monthYear) || []
            groupedByMonth[monthYear].push({ ...user, deliveries: monthDeliveries });
        }
      });
    });

    const sortedMonths = Object.keys(groupedByMonth).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).reverse();

    const initialExpandedState: Record<string, boolean> = {};
    sortedMonths.forEach((month, index) => {
      initialExpandedState[month] = index === 0; // Expand the most recent month by default
    });
    setExpandedMonths(initialExpandedState);

    return sortedMonths.flatMap(month => {
        const usersInMonth = groupedByMonth[month];
        const rows: ProcessedRow[] = [
            { type: "month-header", content: month }
        ];

        usersInMonth.forEach(user => {
            const deliveriesString = user.deliveries.map(d => `${format(new Date(d.date), 'MMM dd')}: ${d.bottles} bottles`).join(', ');
            rows.push({
                type: 'user-data',
                content: user,
                deliveries: deliveriesString,
                month: month,
            });
        });

        return rows;
    });

  }, [data]);
  
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({...prev, [month]: !prev[month]}));
  }

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected month.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
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
              const user = row.content as UserData;
              const month = row.month as string;
              if (expandedMonths[month]) {
                 return (
                    <TableRow key={`${user.name}-${month}`}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{row.deliveries}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setModalUser(user)}>
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
      {modalUser && (
        <ViewDataModal user={modalUser} onClose={() => setModalUser(null)} />
      )}
    </>
  );
}
