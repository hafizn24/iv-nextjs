"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAuth, getRole, type Role } from "@/lib/api";

export function useAuth(required?: Role) {
  const router = useRouter();
  const role = getRole();

  useEffect(() => {
    if (!getRole()) {
      router.replace("/login");
      return;
    }
    if (required && getRole() !== required) {
      router.replace(required === "admin" ? "/checkin" : "/admin");
    }
  }, [router, required]);

  return role;
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-gray-500 hover:text-gray-900"
      onClick={() => {
        clearAuth();
        router.replace("/login");
      }}
    >
      Logout
    </button>
  );
}
