
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
            <svg width="150" height="70" viewBox="0 0 170 80" className="text-primary -ml-4">
                <circle cx="40" cy="40" r="35" fill="hsl(var(--primary))"/>
                <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
                <path d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" fill="hsl(var(--primary))"/>
                <text x="95" y="50" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="30" fill="hsl(var(--primary))" dy=".3em">waters</text>
                <text x="115" y="68" fontFamily="sans-serif" fontSize="10" fill="hsl(var(--muted-foreground))" dy=".3em">FIT TO LIVE</text>
            </svg>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
           <Button asChild variant="outline">
            <Link href="/login" prefetch={false}>
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/register" prefetch={false}>
              Register
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center">
            <div className="flex flex-col justify-center space-y-4 max-w-2xl">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                  Pure, Refreshing, Reliable.
                </h1>
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                  Experience the crisp, clean taste of m.waters, delivered right to your doorstep. Our commitment is to your health and hydration. #StayHydrated
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                <Button asChild size="lg">
                  <Link href="/register" prefetch={false}>
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                   <Link href="#features" prefetch={false}>
                      Learn More
                  </Link>
                </Button>
              </div>
            </div>
             <div className="mt-8 flex items-center justify-center">
               <img
                  src="https://i.ibb.co/rKH1Wfr/2025080301053749.png"
                  width="450"
                  height="450"
                  alt="m.waters bottle"
                  className="mx-auto overflow-hidden object-contain"
                />
             </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Save Water, Save Life</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Why Choose m.waters?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We are dedicated to providing you not just with water, but with a promise of quality, purity, and exceptional service.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              <div className="grid gap-1 text-center">
                <Droplets className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold font-headline">Pure Drinking Water</h3>
                <p className="text-sm text-muted-foreground">
                  Our water goes through a meticulous purification process to ensure every drop is clean, safe, and tastes great.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold font-headline">Clean Guaranteed Service</h3>
                <p className="text-sm text-muted-foreground">
                  We guarantee the cleanliness and hygiene of our bottles and our entire delivery process from start to finish.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Zap className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold font-headline">Fast & Reliable Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Get your water delivered on time, every time. Manage your deliveries easily through our customer dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} m.waters. All rights reserved.</p>
        <div className="sm:ml-auto flex flex-col sm:flex-row gap-2 text-xs">
            <p className="text-muted-foreground">For Delivery: 0300-2109707 / 0321-2109707</p>
            <p className="text-muted-foreground hidden sm:block">|</p>
            <p className="text-muted-foreground">Email: m.waterspk@gmail.com</p>
        </div>
      </footer>
    </div>
  )
}

    