import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export const metadata: Metadata = pageMetadata({
  title: "Privacy & Cookies",
  description:
    "What Cybervolt Labs collects when you shop with us, why, who handles it, and how to switch off analytics cookies or ask us to delete your data.",
  path: "/privacy",
});

const UPDATED = "22 October 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      <div className="flex flex-col gap-2 text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-1 text-2xl font-bold">Privacy &amp; Cookies</h1>
      <p className="mb-6 text-xs text-muted">Last updated {UPDATED}</p>

      <p className="mb-6 text-muted">
        Cybervolt Labs is an online shop based in Ongata Rongai, Kenya. This page explains in plain words what we
        collect when you browse or order, why, who helps us handle it, and the choices you have. We follow
        Kenya&rsquo;s Data Protection Act, 2019.
      </p>

      <Section title="What we collect">
        <p>
          <strong className="text-foreground">When you place an order:</strong> your name, phone number, delivery area and
          address, the items you ordered, and any notes you add. If you pay by M-Pesa we also see the M-Pesa transaction code
          and the name or number it was paid from. We never see your M-Pesa PIN.
        </p>
        <p>
          <strong className="text-foreground">If you create an account:</strong> your email address and your order history,
          plus any rewards on your account (points and a welcome voucher). Your password is handled by our account provider and
          is not visible to us.
        </p>
        <p>
          <strong className="text-foreground">On your device:</strong> the site remembers your cart, saved items, delivery area,
          recently viewed products and recent searches in your browser&rsquo;s own storage, so they are there when you come
          back. This stays on your device; we don&rsquo;t receive it.
        </p>
        <p>
          <strong className="text-foreground">Analytics:</strong> with Google Analytics cookies on, we see which pages are
          visited, how people find us, roughly where and on what device, and the shop steps (viewing a product, adding to the cart, starting checkout, placing an order) and
          some actions such as opening a WhatsApp chat or asking for a price-drop alert. It lets us recognise a returning visitor and improve the shop. We do not use
          advertising cookies and we do not build ad profiles.
        </p>
        <p>
          <strong className="text-foreground">Where you came from:</strong> if you arrive from a link (for example from TikTok or
          a WhatsApp group) we note that source in your browser and add it to your order, so we know which channels work.
        </p>
        <p>
          <strong className="text-foreground">If you message us on WhatsApp:</strong> your number and what you send, which
          WhatsApp also processes under its own terms.
        </p>
      </Section>

      <Section title="Why we use it">
        <ul className="flex flex-col gap-1">
          <li>• To take, deliver and confirm your order, and to handle returns, refunds and support.</li>
          <li>• To run your account and rewards.</li>
          <li>• To keep records we are required to keep for accounts and tax.</li>
          <li>• To measure and improve the site (analytics, only if cookies are on).</li>
          <li>• To contact you about your order. We don&rsquo;t sell your details.</li>
        </ul>
      </Section>

      <Section title="Who handles it for us">
        <p>
          We use a small number of services to run the shop: our database and account provider (Supabase), our website host
          (Netlify), Google (Analytics, and the sheet where we keep orders for delivery), and Safaricom M-Pesa, with a payment
          provider if you choose the M-Pesa prompt at checkout. They handle your data only to provide their service to us. Some
          are based outside Kenya, so your data may be processed abroad. We share order details with our delivery riders only
          as far as needed to deliver to you.
        </p>
      </Section>

      <Section title="Cookies, and how to switch them off">
        <p>
          The only cookies we use are Google Analytics ones, and they are on unless you decline. You can switch them off at any
          time and we will remember your choice:
        </p>
        <p>
          <CookieSettingsButton className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light" />
        </p>
        <p>
          The same &ldquo;Cookie settings&rdquo; button is in the footer of every page. You can also block cookies in your
          browser settings; the shop still works without them.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep order details for as long as we need them to deliver, handle returns and meet our accounting and tax record
          duties. Account details stay until you ask us to delete the account. Analytics data is kept by Google for the period set
          in our analytics settings.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to show you the data we hold about you, correct it, delete it, or stop using it, and you can withdraw
          your consent at any time. Message us on{" "}
          <a href={buildWhatsAppLink("Hello Cybervolt Labs, I have a privacy request about my data.")} className="font-medium text-primary hover:underline">
            WhatsApp
          </a>{" "}
          and we will respond. Some order records may need to be kept for legal reasons, and we will tell you if that applies.
        </p>
        <p>
          If you are not happy with how we handled your data, you can complain to Kenya&rsquo;s Office of the Data Protection
          Commissioner (odpc.go.ke).
        </p>
      </Section>

      <Section title="Changes">
        <p>If we change how we use your data, we will update this page and the date at the top.</p>
      </Section>
    </div>
  );
}
