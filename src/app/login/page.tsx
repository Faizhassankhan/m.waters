
"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrName || !password) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please enter your name/email and password.",
        });
        return;
    }

    setLoading(true);
    const { success, error, userType } = await login(emailOrName, password);
    if (success) {
      if (userType === 'admin') {
        router.push("/");
      } else {
        router.push("/customer-dashboard");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error || "An unexpected error occurred. Please try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Droplets className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">AquaManager</CardTitle>
          <CardDescription>
            Admin & Customer Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrName">Email or Name</Label>
              <Input
                id="emailOrName"
                type="text"
                value={emailOrName}
                onChange={(e) => setEmailOrName(e.target.value)}
                placeholder="admin@aquamanager.com or your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    