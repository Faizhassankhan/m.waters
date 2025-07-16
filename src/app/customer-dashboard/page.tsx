
"use client";

import { useContext, useState, useEffect, useMemo, useRef } from "react";
import * as htmlToImage from 'html-to-image';
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import { Loader2, Share2, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, getYear, getMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));


function CustomerDashboardPage() {
    const { customer, logout } = useContext(AppContext);
    const dataCardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    
    useEffect(() => {
        if (customer && customer.deliveries.length > 0) {
            const lastDeliveryDate = new Date(customer.deliveries[0].date);
            setSelectedMonth(getMonth(lastDeliveryDate));
            setSelectedYear(getYear(lastDeliveryDate));
        }
    }, [customer]);
    
    const availableYears = useMemo(() => {
        if (!customer) return [];
        const years = new Set(customer.deliveries.map(d => getYear(new Date(d.date))));
        return Array.from(years).sort((a, b) => b - a);
    }, [customer]);

    const filteredDeliveries = useMemo(() => {
        if (!customer) return [];
        return customer.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return getYear(deliveryDate) === selectedYear && getMonth(deliveryDate) === selectedMonth;
        });
    }, [customer, selectedMonth, selectedYear]);

    const handleShare = async () => {
        if (!dataCardRef.current || !customer) return;

        setIsSharing(true);
        try {
            const dataUrl = await htmlToImage.toPng(dataCardRef.current, { quality: 0.95, backgroundColor: 'hsl(var(--background))' });
            const link = document.createElement('a');
            link.href = `https://wa.me/?text=${encodeURIComponent(`Check out my delivery report: ${dataUrl}`)}`;
            link.target = '_blank';
            link.click();
        } catch (error) {
            console.error('oops, something went wrong!', error);
            toast({
                variant: "destructive",
                title: "Sharing Failed",
                description: "Could not generate report. Please try again.",
            });
        } finally {
            setIsSharing(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    }

    if (!customer) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const reportTitle = `DELIVERY REPORT - ${months[selectedMonth].label.toUpperCase()} ${selectedYear}`;

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 font-semibold font-headline text-lg">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary"><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10 0 5.523-10 12-10 12s-10-6.477-10-12c0-5.523 4.477-10 10-10z"></path></svg>
                    <span>m.waters Portal</span>
                </div>
                 <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>
            <main className="max-w-2xl mx-auto">
                <div ref={dataCardRef} className="bg-background">
                     <Card style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)' }} className="animate-in fade-in-50 bg-white text-card-foreground">
                        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-headline text-3xl flex items-baseline">
                                    m
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-2 w-2 mx-px inline-block align-baseline"
                                        style={{ fill: 'hsl(var(--primary-foreground))', transform: 'rotate(180deg)' }}
                                    >
                                        <path d="M12 2c5.523 0 10 4.477 10 10 0 5.523-10 12-10 12s-10-6.477-10-12c0-5.523 4.477-10 10-10z" />
                                    </svg>
                                    waters
                                </CardTitle>
                                <div className="text-right">
                                    <p className="font-semibold">{reportTitle}</p>
                                    <p className="text-sm text-primary-foreground/80">{format(new Date(), "MMMM dd, yyyy")}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <p className="text-sm text-muted-foreground">REPORT FOR</p>
                                <p className="font-semibold text-xl">{customer.name}</p>
                            </div>
                            <ScrollArea className="max-h-[40vh] pr-4">
                                {filteredDeliveries.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Bottles</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDeliveries.map(d => (
                                                <TableRow key={d.id}>
                                                    <TableCell>{format(new Date(d.date), 'EEEE, MMM dd')}</TableCell>
                                                    <TableCell className="text-right font-medium">{d.bottles}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        No deliveries found for the selected period.
                                    </div>
                                )}
                            </ScrollArea>
                            <Separator className="my-6" />
                            <div className="flex justify-end items-center text-right">
                                <div>
                                    <p className="text-sm text-muted-foreground">TOTAL BOTTLES (IN PERIOD)</p>
                                    <p className="font-bold text-3xl font-headline text-primary">{filteredDeliveries.reduce((sum, d) => sum + d.bottles, 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <CardFooter className="p-6 pt-4 bg-background rounded-b-lg flex-col items-start gap-4">
                     <div className="flex w-full gap-2 mt-1">
                        <Select 
                            value={String(selectedMonth)} 
                            onValueChange={(value) => setSelectedMonth(Number(value))}
                        >
                            <SelectTrigger>
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
                            disabled={availableYears.length === 0}
                        >
                            <SelectTrigger>
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
                    </div>
                    {customer.canShareReport && (
                        <>
                        <Separator />
                        <Button onClick={handleShare} className="w-full" disabled={isSharing}>
                            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                            {isSharing ? 'Generating...' : 'Share Report on WhatsApp'}
                        </Button>
                        </>
                    )}
                </CardFooter>
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <CustomerDashboardPage />
        </AuthGuard>
    )
}

    