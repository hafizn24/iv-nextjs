"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Nav } from "@/components/nav";
import { api, formatDate, getRole } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Visitor = {
  id: number;
  full_name: string;
  nric_number: string;
  unit_number: string | null;
  purpose: string;
  parking_slot_number: string | null;
  check_in_at: string;
  check_out_at: string | null;
  nric_image_url: string | null;
};

export default function VisitorsPage() {
  useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState("");
  const isAdmin = getRole() === "admin";

  const load = useCallback(async (s: string) => {
    try {
      const qs = s ? `?search=${encodeURIComponent(s)}` : "";
      setVisitors(await api(`/visitors${qs}`));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  async function checkout(id: number) {
    try {
      await api(`/visitors/${id}/check-out`, { method: "POST" });
      toast.success("Checked out");
      load(search);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Check-out failed");
    }
  }

  return (
    <div>
      <Nav links={[{ href: "/checkin", label: "Check In" }, { href: "/visitors", label: "Visitors" }]} />
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search name or NRIC"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => load(search)}>Search</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>NRIC</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Parking</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>NRIC Image</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.full_name}</TableCell>
                <TableCell>{v.nric_number || "—"}</TableCell>
                <TableCell>{v.unit_number || "—"}</TableCell>
                <TableCell>{v.purpose || "—"}</TableCell>
                <TableCell>{v.parking_slot_number || "—"}</TableCell>
                <TableCell>{formatDate(v.check_in_at)}</TableCell>
                <TableCell>{formatDate(v.check_out_at)}</TableCell>
                <TableCell>
                  {v.nric_image_url && (
                    <a href={v.nric_image_url} target="_blank" className="text-blue-600 underline text-sm">
                      view
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {!v.check_out_at && (
                    <Button size="sm" variant="outline" onClick={() => checkout(v.id)}>
                      Check Out
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visitors.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  {isAdmin ? "No visitors found" : "No visitors currently checked in"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
