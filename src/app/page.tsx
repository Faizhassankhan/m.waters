
"use client";

import LandingPage from "@/app/landing/page";

export default function Home() {
  return (
    // This is the root of the site, which will show the public-facing landing page.
    // AuthGuard is not needed here as this page should be accessible to everyone,
    // and logged-in users will be redirected from their respective dashboards if they try to access it.
    <LandingPage />
  );
}
