"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabaseEnabled } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!supabaseEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Admin panel coming soon</h1>
        <p className="mt-2 text-sm text-muted">Accounts aren&rsquo;t set up yet — check back shortly.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Admin sign-in required</h1>
        <p className="mt-2 text-sm text-muted">Log in with an admin account to manage products.</p>
        <Link
          href="/account/login"
          className="tap-target mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">This account doesn&rsquo;t have admin access.</p>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <nav className="flex gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold ${
                pathname === link.href ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="text-sm text-muted hover:text-primary">
          &larr; Back to site
        </Link>
      </div>
      {children}
    </div>
  );
}
