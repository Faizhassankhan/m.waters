
"use client";

import AuthGuard from "@/components/auth-guard";
import LandingPage from "@/app/landing/page";

export default function Home() {
  return (
    <AuthGuard>
      <LandingPage />
    </AuthGuard>
  );
}
