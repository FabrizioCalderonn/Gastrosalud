import { Hero } from "@/components/sections/Hero";
import { Doctora } from "@/components/sections/Doctora";
import { Servicios } from "@/components/sections/Servicios";
import { Seguros } from "@/components/sections/Seguros";
import { Faq } from "@/components/sections/Faq";
import { Blog } from "@/components/sections/Blog";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Doctora />
      <Servicios />
      <Seguros />
      <Faq />
      <Blog />
      <Footer />
    </main>
  );
}
