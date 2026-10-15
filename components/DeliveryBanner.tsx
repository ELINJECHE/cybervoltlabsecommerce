import { SAME_DAY_HEADLINE } from "@/lib/store-info";

// Slim strip above the header on every page. Scrolls away with the page;
// the sticky header below stays.
export default function DeliveryBanner() {
  return (
    <div className="bg-primary px-4 py-2 text-center text-sm font-semibold text-white">
      <span aria-hidden="true">🚚 </span>
      {SAME_DAY_HEADLINE} <span className="font-normal opacity-90">— order today, get it today</span>
    </div>
  );
}
