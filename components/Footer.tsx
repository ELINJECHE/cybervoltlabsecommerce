import Link from "next/link";
import Newsletter from "@/components/Newsletter";
import type { Category } from "@/lib/types";

const PAYMENT_METHODS = ["M-Pesa", "Airtel Money", "Visa", "Mastercard"];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/cybervolt_labs_/" },
  { label: "Facebook", href: "https://www.facebook.com/people/cybervolt-Labs-Kenya/61587610450249/" },
  { label: "TikTok", href: "https://www.tiktok.com/@cybervolt_labs" },
  { label: "LinkedIn", href: "https://ke.linkedin.com/company/cybervoltlabskenya" },
];

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">About</h3>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">Our Story</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            <li><Link href="/returns" className="hover:text-white">Return Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Shop</h3>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            {categories.slice(0, 5).map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className="hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Follow Us</h3>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Newsletter />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="rounded border border-white/20 px-2 py-1 text-[11px] font-medium text-white/80"
            >
              {method}
            </span>
          ))}
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Cybervolt Labs. All rights reserved.</p>
      </div>
    </footer>
  );
}
