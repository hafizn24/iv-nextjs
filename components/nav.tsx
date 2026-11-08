"use client";

import Link from "next/link";
import { LogoutButton } from "@/lib/auth";
import { getRole } from "@/lib/api";
import { MOCK_ENABLED } from "@/lib/mock";

export function Nav({ links }: { links: { href: string; label: string }[] }) {
  const isAdmin = getRole() === "admin";
  const all = isAdmin
    ? [
        { href: "/checkin", label: "Check In" },
        { href: "/visitors", label: "Visitors" },
        { href: "/admin/units", label: "Units" },
        { href: "/admin/parking", label: "Parking" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/audit-logs", label: "Audit Logs" },
      ]
    : links;

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-2">
      <nav className="flex gap-4 text-sm">
        {all.map((l) => (
          <Link key={l.href} href={l.href} className="text-gray-600 hover:text-gray-900">
            {l.label}
          </Link>
        ))}
      </nav>
      <LogoutButton />
      {MOCK_ENABLED && (
        <span className="rounded bg-amber-100 text-amber-800 text-xs px-2 py-0.5">MOCK</span>
      )}
    </header>
  );
}
