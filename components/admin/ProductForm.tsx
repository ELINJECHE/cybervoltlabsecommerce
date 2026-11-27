"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CategoryRow, ProductInput, ProductRow } from "@/lib/admin-products";
import { GOOD_IMAGE_PX, MAX_DESCRIPTION_CHARS, MAX_TITLE_CHARS, MIN_IMAGE_PX, generateId, slugify, uploadProductImage } from "@/lib/admin-products";
import { markUnpublished } from "@/lib/deploy";
import { getProductSupplier, saveProductSupplier } from "@/lib/admin-sourcing";
import { buildPhoneChatLink, normalizeKenyanPhone } from "@/lib/whatsapp";
import { toAdminMessage } from "@/lib/errors";
import { joinFeatureLines, splitFeatureLines, validGtin } from "@/lib/attributes";

interface ProductFormProps {
  categories: CategoryRow[];
  initial?: ProductRow;
  onSubmit: (input: ProductInput) => Promise<void>;
  submitLabel: string;
}

export default function ProductForm({ categories, initial, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const [draftId] = useState(() => initial?.id ?? generateId());

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]?.slug ?? "");
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [discountPrice, setDiscountPrice] = useState(initial?.discount_price?.toString() ?? "");
  const [stock, setStock] = useState(initial && initial.stock > 0 ? initial.stock.toString() : "0");
  const [soldOut, setSoldOut] = useState((initial?.stock ?? 0) < 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  // `features` holds both bullet points and "Label: value" facts (see lib/attributes.ts); the form edits them separately.
  const parsed = splitFeatureLines(initial?.features ?? []);
  const [featuresText, setFeaturesText] = useState(parsed.bullets.join("\n"));
  const [specsText, setSpecsText] = useState(parsed.specs.map((sp) => `${sp.label}: ${sp.value}`).join("\n"));
  const [brand, setBrand] = useState(parsed.reserved.brand ?? "");
  const [mpn, setMpn] = useState(parsed.reserved.mpn ?? "");
  const [gtin, setGtin] = useState(parsed.reserved.gtin ?? "");
  const [condition, setCondition] = useState(parsed.reserved.condition?.toLowerCase() ?? "new");
  const [sizes, setSizes] = useState(parsed.reserved.sizes ?? "");
  const [isNewArrival, setIsNewArrival] = useState(initial?.is_new_arrival ?? false);
  const [isDeal, setIsDeal] = useState(initial?.is_deal ?? false);
  const [dealEndsAt, setDealEndsAt] = useState(initial?.deal_ends_at?.slice(0, 16) ?? "");
  const [dealClaimedPercent, setDealClaimedPercent] = useState(initial?.deal_claimed_percent?.toString() ?? "");
  const [verified, setVerified] = useState(initial?.verified ?? true);
  const [supplier, setSupplier] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supplier details live in the admin-only product_sourcing table, never on the public product.
  useEffect(() => {
    if (!initial) return;
    getProductSupplier(initial.id).then((s) => {
      if (!s) return;
      setSupplier(s.supplier);
      setSupplierPhone(s.phone);
    });
  }, [initial]);

  const normalizedPhone = supplierPhone.trim() ? normalizeKenyanPhone(supplierPhone) : null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file, draftId);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      setError(toAdminMessage(err, "CV-ADM-02", "Image upload failed."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((i) => i !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (images.length === 0) {
      setError("Add at least one photo before saving — products can't display without one.");
      return;
    }

    if (gtin.trim() && !validGtin(gtin)) {
      setError("That barcode (GTIN) isn't valid — it should be 8, 12, 13 or 14 digits with a correct check digit. Check it against the packaging, or leave it blank.");
      return;
    }
    const badSpec = specsText.split("\n").map((l) => l.trim()).find((l) => l && !/^[A-Za-z][^:]{0,27}:\s*\S/.test(l));
    if (badSpec) {
      setError(`Specifications need a label and a value, like "Material: Leather". Fix this line: "${badSpec}"`);
      return;
    }

    if (supplierPhone.trim() && !normalizedPhone) {
      setError("Supplier phone doesn't look like a Kenyan mobile number (e.g. 0712 345 678).");
      return;
    }
    if (supplierPhone.trim() && !supplier.trim()) {
      setError("Add the supplier's name as well as their phone.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input: ProductInput = {
        id: draftId,
        slug: initial?.slug ?? slugify(name),
        name,
        category,
        subcategory: subcategory || null,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        images,
        features: joinFeatureLines({ brand, mpn, gtin: validGtin(gtin) ?? "", condition, sizes, specsText, bulletsText: featuresText }),
        stock: soldOut ? -1 : Math.max(0, Number(stock) || 0),
        is_deal: isDeal,
        deal_ends_at: isDeal && dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
        deal_claimed_percent: isDeal && dealClaimedPercent ? Number(dealClaimedPercent) : null,
        is_new_arrival: isNewArrival,
        verified,
        description: description || null,
      };
      await onSubmit(input);
      markUnpublished();
      if (supplier.trim()) {
        try {
          await saveProductSupplier(draftId, supplier.trim(), normalizedPhone, Number(price));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          setError(
            `Product saved, but the supplier details weren't${msg ? ` (${msg})` : ""}. ` +
              "If this mentions supplier_phone or product_sourcing, run docs/sql/product_sourcing.sql in Supabase first."
          );
          setSubmitting(false);
          return;
        }
      }
      router.push("/admin");
    } catch (err) {
      setError(toAdminMessage(err, "CV-ADM-01", "Something went wrong saving this product."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Product Name</label>
          <input
            id="name"
            required
            maxLength={MAX_TITLE_CHARS}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">
            Brand + product + key details (size, model, material). Google shows about the first 70 characters; the limit is {MAX_TITLE_CHARS}. {name.length}/{MAX_TITLE_CHARS}
          </p>
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subcategory" className="mb-1 block text-sm font-medium">Subcategory (optional)</label>
          <input
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="supplier" className="mb-1 block text-sm font-medium">Supplier (admin only)</label>
          <input
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Jamnet Wholesalers"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="supplierPhone" className="mb-1 block text-sm font-medium">Supplier phone (admin only)</label>
          <input
            id="supplierPhone"
            type="tel"
            value={supplierPhone}
            onChange={(e) => setSupplierPhone(e.target.value)}
            placeholder="0712 345 678"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          {normalizedPhone && (
            <a
              href={buildPhoneChatLink(normalizedPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
            >
              💬 Chat with supplier on WhatsApp
            </a>
          )}
        </div>
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">Price (KES)</label>
          <input
            id="price"
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="discountPrice" className="mb-1 block text-sm font-medium">Discount Price (optional)</label>
          <input
            id="discountPrice"
            type="number"
            min={0}
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="stock" className="mb-1 block text-sm font-medium">
            Stock (0 = not tracked / made-to-order)
          </label>
          <input
            id="stock"
            type="number"
            min={0}
            value={stock}
            disabled={soldOut}
            onChange={(e) => setStock(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
          />

          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soldOut} onChange={(e) => setSoldOut(e.target.checked)} className="h-4 w-4 accent-primary" />
            Sold out (shows &ldquo;Sold out&rdquo;, turns off Add to Cart, tells Google it is out of stock)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">Description (optional)</label>
        <textarea
          id="description"
          rows={3}
          maxLength={MAX_DESCRIPTION_CHARS}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <fieldset className="rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-medium">Product details (shown on the page, sent to Google, used by the filters)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="brand" className="mb-1 block text-sm font-medium">Brand</label>
            <input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Hisense" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor="mpn" className="mb-1 block text-sm font-medium">Model / part number</label>
            <input id="mpn" value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="e.g. H20MOWS11" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor="gtin" className="mb-1 block text-sm font-medium">Barcode (GTIN / EAN)</label>
            <input id="gtin" inputMode="numeric" value={gtin} onChange={(e) => setGtin(e.target.value)} placeholder="8, 12, 13 or 14 digits" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor="condition" className="mb-1 block text-sm font-medium">Condition</label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sizes" className="mb-1 block text-sm font-medium">Sizes to choose from (comma separated, optional)</label>
            <input id="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. 40, 41, 42, 43" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="specs" className="mb-1 block text-sm font-medium">Specifications (one per line, as Label: value)</label>
          <textarea
            id="specs"
            rows={4}
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            placeholder={"Material: Genuine leather\nCapacity: 20 L\nColours: black, white\nPower: 700 W"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">Each line becomes a row in the product&apos;s specification table and a filter on the category page (Colours, Capacity, Material, Size and so on).</p>
        </div>
        {(() => {
          const todo = [
            !brand.trim() && "brand",
            !gtin.trim() && "barcode",
            !specsText.trim() && "at least one specification",
            description.trim().length < 150 && "a description of 150+ characters",
          ].filter(Boolean);
          return todo.length > 0 ? (
            <p className="mt-2 text-xs text-muted">Google Shopping and the filters work best with: {todo.join(", ")}.</p>
          ) : null;
        })()}
      </fieldset>

      <div>
        <label htmlFor="features" className="mb-1 block text-sm font-medium">Features (one per line)</label>
        <textarea
          id="features"
          rows={4}
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Images</p>
        <div className="mb-2 flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-black/60 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm" />
        <p className="mt-1 text-xs text-muted">
          Photos must be at least {MIN_IMAGE_PX}×{MIN_IMAGE_PX} px ({GOOD_IMAGE_PX}×{GOOD_IMAGE_PX} or larger is best), on a plain background with no text or watermarks, or Google Shopping rejects them. Smaller photos are not uploaded.
        </p>
        {uploading && <p className="mt-1 text-xs text-muted">Uploading...</p>}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} className="h-4 w-4 accent-primary" />
          New Arrival
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 accent-primary" />
          Cybervolt Verified
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDeal} onChange={(e) => setIsDeal(e.target.checked)} className="h-4 w-4 accent-primary" />
          Flash Deal
        </label>
      </div>

      {isDeal && (
        <div className="grid gap-4 rounded-card border border-deal/30 bg-deal/5 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dealEndsAt" className="mb-1 block text-sm font-medium">Deal Ends At</label>
            <input
              id="dealEndsAt"
              type="datetime-local"
              value={dealEndsAt}
              onChange={(e) => setDealEndsAt(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="dealClaimedPercent" className="mb-1 block text-sm font-medium">% Claimed (stock urgency bar)</label>
            <input
              id="dealClaimedPercent"
              type="number"
              min={0}
              max={100}
              value={dealClaimedPercent}
              onChange={(e) => setDealClaimedPercent(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="tap-target self-start rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
