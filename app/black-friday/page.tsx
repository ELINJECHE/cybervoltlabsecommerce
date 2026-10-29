import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getActiveCategories, getAllProducts } from "@/lib/products";
import { EXCLUSIVE_GROUP_URL } from "@/lib/community";
import BlackFridayHero from "@/components/BlackFridayHero";
import BlackFridayCountdown from "@/components/BlackFridayCountdown";
import BlackFridayDealGrid from "@/components/BlackFridayDealGrid";
import BlackFridayCalendar from "@/components/BlackFridayCalendar";
import { discounted, maxOff } from "@/components/BlackFridayShelf";

export const metadata: Metadata = pageMetadata({
  title: "Black Friday Deals",
  description:
    "Black Friday at Cybervolt Labs, 30 Oct to 30 Nov: real price cuts on motorcycle gear, appliances, bedding, audio and more, with same-day delivery in Nairobi and M-Pesa payment.",
  path: "/black-friday",
});

const PROMISES = [
  { icon: "🏷️", title: "Real price cuts", text: "The old price you see is our normal price, not an invented one." },
  { icon: "🚚", title: "Free delivery over KSh 5,000", text: "In Nairobi, same-day if you order before 5pm. Countrywide in 2-4 days." },
  { icon: "📲", title: "Pay with M-Pesa", text: "Pay to our Till; we confirm your order on WhatsApp." },
  { icon: "↩️", title: "48-hour returns", text: "Unused items in original packaging, within 48 hours of delivery." },
];

const FAQ = [
  ["When do the deals start?", "Black Friday runs from 30 October to 30 November, with the big day on Friday 27 November. We lead with a different part of the shop each week (see the calendar)."],
  ["Are the discounts real?", "Yes. Every deal shows our normal price crossed out and the new price. We don't inflate the old price."],
  ["How do I not miss a drop?", "Tap the heart on anything you like to save it, and join our free WhatsApp group: we post new drops there first."],
  ["Is there a limit per order?", "Stock is limited, so each order can include up to 5 of any item."],
];

export default async function BlackFridayPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getActiveCategories()]);
  const deals = discounted(products);

  return (
    <div className="bg-background pb-10">
      <div className="bg-[#07070d] pb-6 pt-4 sm:pt-6">
        <BlackFridayHero maxOff={maxOff(products)} />
        <div className="mx-auto mt-5 flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Black Friday at Cybervolt Labs</h1>
            <p className="mt-1 text-sm text-white/75">30 Oct - 30 Nov · Real price cuts · Same-day delivery in Nairobi</p>
          </div>
          <BlackFridayCountdown />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-6" aria-label="Why shop with us">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROMISES.map((p) => (
            <div key={p.title} className="rounded-card border border-border bg-surface p-3">
              <p className="text-2xl" aria-hidden="true">{p.icon}</p>
              <p className="mt-1 text-sm font-bold">{p.title}</p>
              <p className="text-xs text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8" id="deals" aria-label="Black Friday deals">
        <h2 className="mb-3 text-xl font-black">The deals</h2>
        {deals.length > 0 ? (
          <BlackFridayDealGrid products={deals} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        ) : (
          <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center">
            <p className="text-base font-bold">The first drops land on 30 October.</p>
            <p className="mt-1 text-sm text-muted">Save the things you like with the heart, and join our free WhatsApp group to hear first.</p>
            <a href={EXCLUSIVE_GROUP_URL} target="_blank" rel="noopener noreferrer" className="tap-target mt-3 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">Join the free group</a>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10" id="calendar" aria-label="Black Friday day by day">
        <h2 className="mb-1 text-xl font-black">Black Friday, day by day</h2>
        <p className="mb-3 text-sm text-muted">Each stretch of the month leads with a different part of the shop.</p>
        <BlackFridayCalendar />
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10" aria-label="Shop by category">
        <h2 className="mb-3 text-xl font-black">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="tap-target rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold hover:border-primary hover:text-primary">{c.name}</Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10" aria-label="Questions">
        <h2 className="mb-3 text-xl font-black">Good to know</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-card border border-border bg-surface p-3">
              <summary className="cursor-pointer text-sm font-bold">{q}</summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
