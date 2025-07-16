
"use client";

import { useState, useEffect, useRef, useContext } from "react";
import AuthGuard from "@/components/auth-guard";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppContext } from "@/contexts/app-provider";
import { Mic, MicOff, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { parseDeliveryInfo } from "@/ai/flows/parse-delivery-flow";
import { AddUserDataPayload } from "@/lib/types";

function VoiceImportPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parsedData, setParsedData] = useState<Omit<AddUserDataPayload, 'date'> | null>(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    
    const { toast } = useToast();
    const { addUserData, refreshData } = useContext(AppContext);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                // We only want to set the final, complete transcript.
                // We can set the final part here. The hook that processes the
                // transcript will only run when recording stops.
                if (finalTranscript) {
                    setTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
                }
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                toast({
                    variant: "destructive",
                    title: "Recognition Error",
                    description: `An error occurred: ${event.error}`,
                });
                setIsRecording(false);
            };
        } else {
            toast({
                variant: "destructive",
                title: "Browser Not Supported",
                description: "Your browser does not support voice recognition.",
            });
        }
    }, [toast]);
    
    const handleToggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            setTranscript("");
            setParsedData(null);
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };
    
    useEffect(() => {
        if (!isRecording && transcript.trim() !== "") {
            const processTranscript = async () => {
                setIsProcessing(true);
                try {
                    const result = await parseDeliveryInfo({ command: transcript });
                    if (result.name && result.bottles > 0) {
                        setParsedData(result);
                        toast({
                            title: "Data Parsed",
                            description: `Identified: ${result.name} with ${result.bottles} bottles. Please verify and save.`,
                        });
                    } else {
                        throw new Error("Could not extract name or bottles.");
                    }
                } catch (error) {
                    console.error("Error parsing transcript:", error);
                    toast({
                        variant: "destructive",
                        title: "Parsing Failed",
                        description: "Could not understand the command. Please try again.",
                    });
                    setParsedData(null);
                } finally {
                    setIsProcessing(false);
                }
            };
            processTranscript();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording, transcript]);

    const handleSaveData = async () => {
        if (!parsedData || !selectedDate) {
            toast({ variant: "destructive", title: "Missing Data", description: "Please ensure all fields are filled." });
            return;
        }
        setIsSaving(true);
        try {
            await addUserData({ ...parsedData, date: selectedDate });
            toast({
                title: "Success",
                description: `Data for ${parsedData.name} has been saved.`,
            });
            await refreshData();
            // Reset state
            setTranscript("");
            setParsedData(null);
            setSelectedDate(format(new Date(), "yyyy-MM-dd"));
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Saving Data",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                        Voice Data Import
                    </h2>
                </div>
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="font-headline">Record Delivery</CardTitle>
                        <CardDescription>
                            Press the button and speak the customer's name and bottle count (e.g., "John Doe 5 bottles").
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                className={`rounded-full h-24 w-24 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
                                onClick={handleToggleRecording}
                            >
                                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                            </Button>
                            <p className="text-muted-foreground">
                                {isRecording ? "Listening..." : "Press to start recording"}
                            </p>
                        </div>
                        
                        {(transcript || isProcessing || parsedData) && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <div>
                                    <Label>Transcript</Label>
                                    <p className="font-mono text-sm p-2 bg-background rounded-md min-h-[40px]">
                                        {transcript || "..."}
                                    </p>
                                </div>

                                {isProcessing && (
                                    <div className="flex items-center gap-2 text-primary">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Analyzing transcript...</span>
                                    </div>
                                )}
                                
                                {parsedData && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="parsed-name">User Name</Label>
                                                <Input id="parsed-name" value={parsedData.name} onChange={(e) => setParsedData(p => p ? {...p, name: e.target.value} : null)} />
                                            </div>
                                            <div>
                                                <Label htmlFor="parsed-bottles">Bottles</Label>
                                                <Input id="parsed-bottles" type="number" value={parsedData.bottles} onChange={(e) => setParsedData(p => p ? {...p, bottles: Number(e.target.value)} : null)} />
                                            </div>
                                        </div>
                                         <div>
                                            <Label htmlFor="delivery-date">Delivery Date</Label>
                                            <Input id="delivery-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <Button className="w-full" onClick={handleSaveData} disabled={!parsedData || isSaving || isProcessing}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Data
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function Home() {
    return (
        <AuthGuard>
            <VoiceImportPage />
        </AuthGuard>
    );
}

// Add SpeechRecognition to window type to avoid TypeScript errors
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
