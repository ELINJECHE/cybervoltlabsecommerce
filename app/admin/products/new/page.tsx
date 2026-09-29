"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { listCategoriesAdmin, createProduct, type CategoryRow } from "@/lib/admin-products";

export default function NewProductPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategoriesAdmin()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Add Product</h1>
      <ProductForm categories={categories} onSubmit={createProduct} submitLabel="Create Product" />
    </div>
  );
}
