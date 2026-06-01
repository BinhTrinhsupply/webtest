import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/site/Hero";
import { ProductHub } from "@/components/site/ProductHub";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <ProductHub />
      <Testimonials />
      <CTA />
    </>
  );
}
