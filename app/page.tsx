"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRole, getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setRole(getRole());
  }, [router]);

  if (!role) return null;
  router.replace(role === "admin" ? "/admin/audit-logs" : "/checkin");
  return null;
}
