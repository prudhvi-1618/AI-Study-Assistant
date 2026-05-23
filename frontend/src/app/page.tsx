'use client';

import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { StatsStrip } from '@/components/landing/StatsStrip';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TestimonialsGrid } from '@/components/landing/TestimonialsGrid';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="bg-white dark:bg-[#0F0F0F]">
      <Navbar />
      <HeroSection />
      <FeatureGrid />
      <StatsStrip />
      <HowItWorks />
      <TestimonialsGrid />
      <FinalCTA />
      <Footer />
    </main>
  );
}
