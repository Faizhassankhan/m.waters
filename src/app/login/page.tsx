
"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppContext } from "@/contexts/app-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
            description: "Please enter your identifier and password.",
        });
        return;
    }

    setLoading(true);
    try {
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
    } catch (e: any) {
       toast({
          variant: "destructive",
          title: "Login Failed",
          description: "An unexpected error occurred during login.",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex flex-col items-center justify-center">
                 <svg width="150" height="70" viewBox="0 0 170 80" className="text-primary">
                    <circle cx="40" cy="40" r="35" fill="currentColor"/>
                    <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
                    <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="currentColor"/>
                    <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="35" fill="currentColor" dy=".3em">waters</text>
                    <text x="115" y="68" fontFamily="sans-serif" fontSize="12" fill="hsl(var(--muted-foreground))" dy=".3em">FIT TO LIVE</text>
                </svg>
            </div>
          <CardTitle className="sr-only">m.waters</CardTitle>
          <CardDescription>
            Admin & Customer Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrName">Email or Admin Username</Label>
              <Input
                id="emailOrName"
                type="text"
                value={emailOrName}
                onChange={(e) => setEmailOrName(e.target.value)}
                placeholder="e.g., admin@gmail.com or user@example.com"
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
        <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm">
                New customer?{" "}
                <Link href="/register" className="underline">
                    Register here
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
