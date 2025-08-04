"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      // Only show the banner if the app is not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // @ts-ignore - 'prompt' is a valid method on the BeforeInstallPromptEvent
    const promptResult = await installPrompt.prompt();
    
    // @ts-ignore
    const { outcome } = await promptResult.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    
    setInstallPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-secondary shadow-lg animate-in slide-in-from-top-full duration-500">
      <div className="container mx-auto flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="bg-background p-2 rounded-lg">
             <Download className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-secondary-foreground">Install m.waters App</p>
            <p className="text-xs text-muted-foreground">Add to your home screen for easy access.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstallClick}>
                Install
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-9 w-9">
                <X className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
