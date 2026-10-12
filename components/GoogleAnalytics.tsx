import Script from "next/script";
import { CONSENT_KEY } from "@/lib/consent";

// Set NEXT_PUBLIC_GA4_ID in .env.local to enable. This is the ONE analytics
// script the project budget allows — do not also add Meta Pixel alongside it.
// NEXT_PUBLIC_GA4_ID_2 is an optional second property: the same gtag.js load
// reports every visit to both, neither overwrites the other.
// Google Consent Mode v2: everything starts denied; CookieConsent grants
// analytics_storage only after the visitor accepts (and restores that choice
// on later visits).
const GA4_IDS = [process.env.NEXT_PUBLIC_GA4_ID, process.env.NEXT_PUBLIC_GA4_ID_2].filter(
  (id): id is string => Boolean(id)
);

export default function GoogleAnalytics() {
  if (GA4_IDS.length === 0) return null;

  const configCalls = GA4_IDS.map((id) => `gtag('config', '${id}');`).join("\n          ");

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_IDS[0]}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
          });
          try {
            if (localStorage.getItem('${CONSENT_KEY}') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
          gtag('js', new Date());
          ${configCalls}
        `}
      </Script>
    </>
  );
}
