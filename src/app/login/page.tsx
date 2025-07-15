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
import { Water, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const { login } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username !== 'admin') {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username. Please try again.",
      });
      return;
    }
    const success = login(password);
    if (success) {
      router.push("/");
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid password. Please try again.",
      });
    }
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
            Admin Panel Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
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
                placeholder="admin2007"
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold">
              Log In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
