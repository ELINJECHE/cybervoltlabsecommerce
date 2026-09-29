import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getAllCategories } from "@/lib/products";

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
    default: "Cybervolt Labs — Phones, Fashion, Furniture & More, Delivered in Kenya",
    template: "%s | Cybervolt Labs",
  },
  description:
    "Cybervolt Labs sells mobile phones, laptops, fashion accessories, furniture, home décor, electronics and more across Kenya, with M-Pesa payment and fast delivery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getAllCategories();

  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${brandFont.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <CategoryNav categories={categories} />
            <main className="min-h-screen">{children}</main>
            <Footer categories={categories} />
            <WhatsAppFloatButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
