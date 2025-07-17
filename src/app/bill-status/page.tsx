
"use client";

import { useContext, useMemo } from "react";
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { format, getYear, getMonth, setMonth, setYear } from "date-fns";

function BillStatusPage() {
    const { customerData, logout } = useContext(AppContext);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const handleGoHome = () => {
        router.push("/customer-dashboard");
    }

    const billHistory = useMemo(() => {
        if (!customerData) return [];

        const history: { month: string; year: number; status: 'paid' | 'not_paid_yet' | 'pending'; totalBottles: number; totalBill: number }[] = [];
        const deliveryMonths = new Set<string>();

        // Get all unique month-year combos from deliveries
        customerData.deliveries.forEach(d => {
            const date = new Date(d.date);
            deliveryMonths.add(`${getMonth(date)}-${getYear(date)}`);
        });

        deliveryMonths.forEach(monthYearStr => {
            const [month, year] = monthYearStr.split('-').map(Number);
            
            const deliveriesInMonth = customerData.deliveries.filter(d => {
                const date = new Date(d.date);
                return getMonth(date) === month && getYear(date) === year;
            });

            if (deliveriesInMonth.length > 0) {
                const totalBottles = deliveriesInMonth.reduce((sum, d) => sum + d.bottles, 0);
                const bottlePrice = customerData.bottlePrice || 100;
                const totalBill = totalBottles * bottlePrice;

                const statusEntry = customerData.monthlyStatuses.find(s => s.month === month && s.year === year);
                const status = statusEntry ? statusEntry.status : 'pending';

                history.push({
                    month: format(setMonth(new Date(), month), 'MMMM'),
                    year: year,
                    status,
                    totalBottles,
                    totalBill,
                });
            }
        });

        // Sort by most recent first
        return history.sort((a, b) => new Date(b.year, months.indexOf(b.month)).getTime() - new Date(a.year, months.indexOf(a.month)).getTime());
    }, [customerData]);

    const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), "MMMM"));

    const renderHeader = () => (
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 font-semibold font-headline text-lg">
                <svg width="150" height="70" viewBox="0 0 170 80" className="text-primary -ml-4">
                    <circle cx="40" cy="40" r="35" fill="currentColor"/>
                    <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
                    <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="currentColor"/>
                    <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="40" fill="currentColor" dy=".3em">waters</text>
                    <text x="115" y="68" fontFamily="sans-serif" fontSize="20" fill="hsl(var(--muted-foreground))" dy=".3em">FIT TO LIVE</text>
                </svg>
            </div>
             <div className="flex items-center gap-2">
                <Button onClick={handleGoHome} variant="outline" size="sm">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            {renderHeader()}
            <main className="max-w-4xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Bill Status History</CardTitle>
                        <CardDescription>
                           Here you can see the payment status for each month's bill as marked by the administration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Billing Period</TableHead>
                                    <TableHead className="text-center">Total Bottles</TableHead>
                                    <TableHead className="text-center">Total Bill (PKR)</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billHistory.length > 0 ? (
                                    billHistory.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.month}, {item.year}</TableCell>
                                            <TableCell className="text-center">{item.totalBottles}</TableCell>
                                            <TableCell className="text-center font-semibold">{item.totalBill.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                {item.status === 'paid' && (
                                                    <div className="inline-block border-2 border-green-600 text-green-600 font-bold uppercase text-center transform -rotate-12 p-2 text-sm rounded-md">
                                                        Paid
                                                    </div>
                                                )}
                                                {item.status === 'not_paid_yet' && (
                                                    <div className="inline-block border-2 border-red-600 text-red-600 font-bold uppercase text-center transform -rotate-12 p-2 text-sm rounded-md">
                                                        Not Paid Yet
                                                    </div>
                                                )}
                                                {item.status === 'pending' && (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No billing history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <BillStatusPage />
        </AuthGuard>
    );
}
