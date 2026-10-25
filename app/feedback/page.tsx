import type { Metadata } from "next";
import Link from "next/link";
import FeedbackForm from "@/components/FeedbackForm";

export const metadata: Metadata = { title: "Vesper feedback", description: "Tell us how the Vesper beta went." };

export default async function Feedback({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const email = String((await searchParams).email ?? "").slice(0, 254);
  return (
    <main className="fb-page">
      <Link className="fb-back" href="/">← Vesper</Link>
      <h1>How was your beta?</h1>
      <p>Your 7 days are up, or you just want to tell us something. Tell us what you think. If you would like to keep using Vesper, say so here and we will send you an activation key.</p>
      <FeedbackForm defaultEmail={email} />
    </main>
  );
}
