import { getAllProductIds } from "@/lib/products";
import EditProductClient from "@/components/admin/EditProductClient";

// Required because output: "export" pre-renders every dynamic route at build
// time. New products created in the admin panel get their own edit page
// once the deploy-hook rebuild completes and regenerates this list — the
// admin product LIST itself is unaffected (it fetches live from Supabase),
// only this specific /edit URL needs a build to exist for a brand-new id.
export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return ids.map((id) => ({ id }));
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <EditProductClient id={params.id} />;
}
