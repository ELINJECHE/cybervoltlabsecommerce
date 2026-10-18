"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { toAdminMessage } from "@/lib/errors";
import {
  listCategoriesAdmin,
  getProductAdmin,
  updateProduct,
  type CategoryRow,
  type ProductRow,
} from "@/lib/admin-products";

export default function EditProductClient({ id }: { id: string }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listCategoriesAdmin(), getProductAdmin(id)])
      .then(([cats, prod]) => {
        setCategories(cats);
        setProduct(prod);
      })
      .catch((err) => setError(toAdminMessage(err, "CV-ADM-04", "Failed to load product.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (error) return <p className="rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>;
  if (!product) return <p className="text-sm text-muted">Product not found.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Edit Product</h1>
      <ProductForm
        categories={categories}
        initial={product}
        onSubmit={(input) => updateProduct(product.id, input)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
