import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import CategoryNav from "@/components/CategoryNav";
import TrackSource from "@/components/TrackSource";
import DeliveryBanner from "@/components/DeliveryBanner";
import Footer from "@/components/Footer";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import BottomNav from "@/components/BottomNav";
import ToastHost from "@/components/ToastHost";
import { BOTTOM_NAV_ENABLED } from "@/lib/community";
import { getActiveCategories } from "@/lib/products";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";

// Two weights of a single Google Font, per the performance budget.
const brandFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cybervoltlabs.co.ke"),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_KE",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getActiveCategories();

  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${brandFont.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <TrackSource />
            <DeliveryBanner />
            <CategoryNav categories={categories} />
            <main className={`min-h-screen ${BOTTOM_NAV_ENABLED ? "pb-16 lg:pb-0" : ""}`}>{children}</main>
            <Footer categories={categories} />
            <WhatsAppFloatButton />
            <CookieConsent />
            <BottomNav />
            <ToastHost />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
