"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CategoryRow, ProductInput, ProductRow } from "@/lib/admin-products";
import { generateId, slugify, uploadProductImage } from "@/lib/admin-products";
import { markUnpublished } from "@/lib/deploy";

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
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [featuresText, setFeaturesText] = useState((initial?.features ?? []).join("\n"));
  const [isNewArrival, setIsNewArrival] = useState(initial?.is_new_arrival ?? false);
  const [isDeal, setIsDeal] = useState(initial?.is_deal ?? false);
  const [dealEndsAt, setDealEndsAt] = useState(initial?.deal_ends_at?.slice(0, 16) ?? "");
  const [dealClaimedPercent, setDealClaimedPercent] = useState(initial?.deal_claimed_percent?.toString() ?? "");
  const [verified, setVerified] = useState(initial?.verified ?? true);
  const [jumiaUrl, setJumiaUrl] = useState(initial?.jumia_url ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file, draftId);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
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
        features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        stock: Number(stock),
        is_deal: isDeal,
        deal_ends_at: isDeal && dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
        deal_claimed_percent: isDeal && dealClaimedPercent ? Number(dealClaimedPercent) : null,
        is_new_arrival: isNewArrival,
        verified,
        description: description || null,
        jumia_url: jumiaUrl || null,
      };
      await onSubmit(input);
      markUnpublished();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this product.");
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
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
          <label htmlFor="jumiaUrl" className="mb-1 block text-sm font-medium">Jumia URL (optional)</label>
          <input
            id="jumiaUrl"
            value={jumiaUrl}
            onChange={(e) => setJumiaUrl(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
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
            onChange={(e) => setStock(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">Description (optional)</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

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
