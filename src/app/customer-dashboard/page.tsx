
"use client";

import { useContext, useState, useEffect, useMemo, useRef } from "react";
import * as htmlToImage from 'html-to-image';
import { AppContext } from "@/contexts/app-provider";
import AuthGuard from "@/components/auth-guard";
import { Loader2, Share2, LogOut, MessageCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, getYear, getMonth, set, startOfMonth, lastDayOfMonth } from "date-fns";
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
import { BillingRecord } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";


const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), "MMMM"),
}));


function CustomerDashboardPage() {
    const { customerData, logout, addFeedback } = useContext(AppContext);
    const dataCardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    
    useEffect(() => {
        if (customerData?.deliveries?.length) {
            const hasDeliveriesThisMonth = customerData.deliveries.some(d => {
                const deliveryDate = new Date(d.date);
                return getYear(deliveryDate) === getYear(new Date()) && getMonth(deliveryDate) === getMonth(new Date());
            });

            if (hasDeliveriesThisMonth) {
                setSelectedMonth(getMonth(new Date()));
                setSelectedYear(getYear(new Date()));
            } else {
                const lastDeliveryDate = new Date(
                    Math.max(...customerData.deliveries.map(d => new Date(d.date).getTime()))
                );
                setSelectedMonth(getMonth(lastDeliveryDate));
                setSelectedYear(getYear(lastDeliveryDate));
            }
        } else {
             const currentDate = new Date();
            setSelectedMonth(getMonth(currentDate));
            setSelectedYear(getYear(currentDate));
        }
    }, [customerData?.deliveries]);
    
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        if (customerData && customerData.deliveries) {
            customerData.deliveries.forEach(d => years.add(getYear(new Date(d.date))));
        }
        years.add(getYear(new Date()));
        return Array.from(years).sort((a, b) => b - a);
    }, [customerData]);

    const filteredDeliveries = useMemo(() => {
        if (!customerData || !customerData.deliveries) return [];
        return customerData.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return getYear(deliveryDate) === selectedYear && getMonth(deliveryDate) === selectedMonth;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [customerData, selectedMonth, selectedYear]);
    
    const currentBillStatus = useMemo(() => {
        if (!customerData || !customerData.monthlyStatuses) return 'not_paid_yet';
        const statusEntry = customerData.monthlyStatuses.find(s => s.month === selectedMonth && s.year === selectedYear);
        return statusEntry ? statusEntry.status : 'not_paid_yet';
    }, [customerData, selectedMonth, selectedYear]);
    
    const billingRecordForPeriod = useMemo((): (BillingRecord & { balance: number }) | null => {
        if (!customerData || !customerData.billingRecords) return null;
        const record = customerData.billingRecords.find(r => r.month === selectedMonth && r.year === selectedYear);
        if (!record) return null;
        return {
            ...record,
            balance: record.total_bill - record.amount_paid
        };
    }, [customerData, selectedMonth, selectedYear]);


    const handleShare = async () => {
        if (!dataCardRef.current || !customerData) return;

        setIsSharing(true);
        try {
            const dataUrl = await htmlToImage.toPng(dataCardRef.current, { quality: 0.95, backgroundColor: 'hsl(var(--background))' });
            
            const blob = await (await fetch(dataUrl)).blob();
            const fileName = `delivery-report-${customerData.name}-${months[selectedMonth].label}-${selectedYear}.png`;
            const file = new File([blob], fileName, { type: blob.type });

            const shareData = {
                files: [file],
                title: `Delivery Report for ${customerData.name}`,
                text: `Here is the delivery report for ${customerData.name}.`,
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = fileName;
                link.click();
                toast({
                    title: "Image downloaded",
                    description: "Your browser doesn't support direct sharing. The report image has been downloaded for you to share manually.",
                });
            }

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
        router.push("/landing");
    }

    const handleWhatsAppRedirect = () => {
        const phoneNumber = "923116523470";
        const url = `https://wa.me/${phoneNumber}`;
        window.open(url, '_blank');
    }

    const handleFeedbackSubmit = async () => {
        if (!feedbackText.trim() || !customerData) {
            toast({
                variant: 'destructive',
                title: 'Feedback cannot be empty.',
            });
            return;
        }
        setIsSubmittingFeedback(true);
        try {
            await addFeedback(feedbackText);
            toast({
                title: 'Feedback Submitted',
                description: 'Thank you for your valuable feedback!',
            });
            setFeedbackText('');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error.message || 'Could not submit feedback. Please try again.',
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };


    const renderHeader = () => (
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 font-semibold font-headline text-lg">
                <svg width="150" height="70" viewBox="0 0 170 80" className="text-primary -ml-4">
                    <circle cx="40" cy="40" r="35" fill="hsl(var(--primary))"/>
                    <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
                    <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="hsl(var(--primary))"/>
                    <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="30" fill="hsl(var(--primary))" dy=".3em">waters</text>
                    <text x="115" y="68" fontFamily="sans-serif" fontSize="10" fill="hsl(var(--muted-foreground))" dy=".3em">FIT TO LIVE</text>
                </svg>
            </div>
             <div className="flex items-center gap-2">
                <Button onClick={handleWhatsAppRedirect} variant="outline" size="icon" className="rounded-full bg-green-500 text-white hover:bg-green-600 hover:text-white">
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">Contact on WhatsApp</span>
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );

    const reportTitle = `DELIVERY REPORT - ${months[selectedMonth]?.label.toUpperCase() || ''} ${selectedYear}`;
    
    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            {renderHeader()}
            <main className="max-w-2xl mx-auto space-y-6">
                <div ref={dataCardRef} className="bg-background">
                     <Card style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)' }} className="animate-in fade-in-50 bg-white text-card-foreground">
                        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-headline text-3xl flex items-baseline">
                                     <svg width="150" height="70" viewBox="0 0 170 80" className="-ml-4">
                                        <circle cx="40" cy="40" r="35" fill="#ECF0F1" stroke="#34495E" strokeWidth="2" />
                                        <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="#34495E" textAnchor="middle" dominantBaseline="central">m</text>
                                        <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="#ECF0F1"/>
                                        <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="30" fill="#ECF0F1" dy=".3em">waters</text>
                                        <text x="115" y="68" fontFamily="sans-serif" fontSize="10" fill="#ECF0F1" dy=".3em">FIT TO LIVE</text>
                                    </svg>
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
                                <p className="font-semibold text-xl">{customerData?.name || '...'}</p>
                            </div>
                            <ScrollArea className="h-[250px] pr-4">
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
                <Card>
                    <CardHeader className="p-6 pb-4">
                        <div className="flex w-full gap-2">
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
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                         {billingRecordForPeriod ? (
                            <div className="space-y-4">
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <h3 className="font-headline text-lg">Billing Summary</h3>
                                    {currentBillStatus === 'paid' ? (
                                    <div className="inline-block border-2 border-green-600 text-green-600 font-bold uppercase text-center transform -rotate-12 p-2 text-sm rounded-md">
                                            Paid
                                        </div>
                                    ) : (
                                    <div className="inline-block border-2 border-red-600 text-red-600 font-bold uppercase text-center transform -rotate-12 p-2 text-sm rounded-md">
                                            Unpaid
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="sm:border-r sm:border-muted-foreground/20 pr-4">
                                        <p className="text-sm text-muted-foreground">Total Bill</p>
                                        <p className="font-semibold text-lg">{billingRecordForPeriod.total_bill.toLocaleString()} PKR</p>
                                    </div>
                                    <div className="sm:border-r sm:border-muted-foreground/20 pr-4">
                                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                                        <p className="font-semibold text-lg text-green-600">{billingRecordForPeriod.amount_paid.toLocaleString()} PKR</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Balance</p>
                                        <p className="font-semibold text-lg text-red-600">{billingRecordForPeriod.balance.toLocaleString()} PKR</p>
                                    </div>
                                </div>
                            </div>
                         ) : (
                             <div className="text-center text-muted-foreground py-4">
                                No billing record found for this period.
                             </div>
                         )}
                    </CardContent>
                    <CardFooter className="flex-col gap-4 p-6 pt-0">
                         {customerData?.canShareReport && (
                            <Button onClick={handleShare} className="w-full" disabled={isSharing}>
                                {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                                {isSharing ? 'Generating...' : 'Share Report as Image'}
                            </Button>
                         )}
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Feedback</CardTitle>
                        <CardDescription>We value your feedback. Please let us know how we can improve.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full gap-2">
                            <Textarea 
                                placeholder="Type your message here..." 
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                            />
                            <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback || !feedbackText.trim()}>
                                {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Submit Feedback
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <p className="text-center text-xs text-muted-foreground pb-4">
                    If the data does not appear, please refresh the page.
                </p>
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

    
