"use client";

import { useEffect, useState } from "react";
import {
  listCategoriesAdmin,
  createCategory,
  deleteCategory,
  slugify,
  type CategoryRow,
} from "@/lib/admin-products";
import { markUnpublished } from "@/lib/deploy";
import { toAdminMessage } from "@/lib/errors";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setCategories(await listCategoriesAdmin());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCategory({ slug: slugify(name), name });
      markUnpublished();
      setName("");
      await load();
    } catch (err) {
      setError(toAdminMessage(err, "CV-ADM-01", "Failed to create category."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(slug: string, catName: string) {
    if (!confirm(`Delete "${catName}"? Products in this category won't be deleted, but will lose their category.`)) return;
    try {
      await deleteCategory(slug);
      markUnpublished();
      await load();
    } catch (err) {
      setError(toAdminMessage(err, "CV-ADM-01", "Failed to delete category."));
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Categories</h1>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          required
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 flex-1 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={submitting}
          className="tap-target rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {error && <p className="mb-4 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c.slug} className="flex items-center justify-between rounded-card border border-border bg-surface p-3 text-sm">
              <span className="font-medium">{c.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(c.slug, c.name)}
                className="font-medium text-deal hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
