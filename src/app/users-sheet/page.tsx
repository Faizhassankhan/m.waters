
"use client";

import { useContext, useMemo, useState, useEffect } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { AppContext } from "@/contexts/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYear, getMonth, format, getDate } from "date-fns";

const DEFAULT_BOTTLE_PRICE = 100;

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));

const dates = Array.from({ length: 31 }, (_, i) => i + 1);


function UsersSheetPage() {
    const { userProfiles } = useContext(AppContext);
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [selectedDate, setSelectedDate] = useState<string>("all");
    
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        userProfiles.forEach(user => {
            user.deliveries.forEach(delivery => {
                years.add(getYear(new Date(delivery.date)));
            });
        });
        years.add(getYear(new Date()));
        return Array.from(years).sort((a, b) => b - a);
    }, [userProfiles]);

    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    const usersSummary = useMemo(() => {
        return userProfiles.map(user => {
            const filteredDeliveries = user.deliveries.filter(delivery => {
                const deliveryDate = new Date(delivery.date);
                const isMonthMatch = getMonth(deliveryDate) === selectedMonth;
                const isYearMatch = getYear(deliveryDate) === selectedYear;
                const isDateMatch = selectedDate === "all" || getDate(deliveryDate) === Number(selectedDate);
                
                return isMonthMatch && isYearMatch && isDateMatch;
            });

            const totalBottles = filteredDeliveries.reduce((sum, delivery) => sum + delivery.bottles, 0);
            const bottlePrice = user.bottlePrice || DEFAULT_BOTTLE_PRICE;
            const totalBill = totalBottles * bottlePrice;
            
            return {
                ...user,
                totalBottles,
                totalBill
            };
        })
        .filter(user => user.totalBottles > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [userProfiles, selectedMonth, selectedYear, selectedDate]);
    
    const grandTotalBottles = useMemo(() => {
        return usersSummary.reduce((sum, user) => sum + user.totalBottles, 0);
    }, [usersSummary]);
    
    const grandTotalBill = useMemo(() => {
        return usersSummary.reduce((sum, user) => sum + user.totalBill, 0);
    }, [usersSummary]);

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Users Sheet
                    </h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Monthly User Summary</CardTitle>
                        <CardDescription>
                            A summary of total bottles and billings for each user for a selected period.
                        </CardDescription>
                         <div className="flex items-center space-x-2 pt-4">
                            <Select 
                                value={String(selectedMonth)} 
                                onValueChange={(value) => setSelectedMonth(Number(value))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month.value} value={String(month.value)}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={String(selectedYear)} 
                                onValueChange={(value) => setSelectedYear(Number(value))}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Select 
                                value={selectedDate} 
                                onValueChange={setSelectedDate}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Date" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="all">All Dates</SelectItem>
                                    {dates.map(date => (
                                        <SelectItem key={date} value={String(date)}>
                                            {date}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Total Bottles</TableHead>
                                        <TableHead className="text-right">T.Bill (PKR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersSummary.length > 0 ? (
                                        usersSummary.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-right font-bold">{user.totalBottles.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{user.totalBill.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No data found for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                 {usersSummary.length > 0 && (
                                    <TableFooter>
                                        <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                            <TableCell>Grand Total</TableCell>
                                            <TableCell className="text-right text-lg">{grandTotalBottles.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-lg">{grandTotalBill.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <UsersSheetPage />
        </AuthGuard>
    );
}
