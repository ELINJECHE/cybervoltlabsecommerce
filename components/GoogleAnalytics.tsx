import Script from "next/script";

// Set NEXT_PUBLIC_GA4_ID in .env.local to enable. This is the ONE analytics
// script the project budget allows — do not also add Meta Pixel alongside it.
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export default function GoogleAnalytics() {
  if (!GA4_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}');
        `}
      </Script>
    </>
  );
}
