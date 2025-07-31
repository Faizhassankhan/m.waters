
"use client";

// This is the root of the site, which will show the public-facing landing page.
// The AuthGuard is not strictly needed here if the page is public, but
// we'll keep it to handle cases where a logged-in user might try to access it,
// although our guard logic now allows this.
import AuthGuard from "@/components/auth-guard";
import LandingPage from "@/app/landing/page";

export default function Home() {
  return (
    // The AuthGuard will ensure that if a user is NOT logged in, they can see this page.
    // If they ARE logged in, it will also let them see it without redirecting.
    <AuthGuard>
      <LandingPage />
    </AuthGuard>
  );
}
