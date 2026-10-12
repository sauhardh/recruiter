import CTA from "@/components/home/cta";
import Footer from "@/components/home/footer";
import Hero from "@/components/home/hero";
import Navbar from "@/components/home/navbar";
import Preview from "@/components/home/preview";
import Steps from "@/components/home/steps";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F6F3] font-sans text-[#101010] selection:bg-[#2F4BFF] selection:text-white">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <Hero />
        {/* Product preview */}
        <Preview />
        {/* Steps */}

        <Steps />
        {/* CTA */}
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
