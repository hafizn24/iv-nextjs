"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Nav } from "@/components/nav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Unit = { id: number; unit_number: string; owner_name: string; active: boolean };

export default function UnitsPage() {
  useAuth("admin");
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({ unit_number: "", owner_name: "" });

  const load = useCallback(async () => {
    setUnits(await api("/units"));
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/units", { method: "POST", body: JSON.stringify(form) });
      setForm({ unit_number: "", owner_name: "" });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    try {
      await api(`/units/${id}`, { method: "DELETE" });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <Nav links={[]} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <Card>
          <CardHeader><CardTitle>Add Unit</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={add} className="flex gap-2">
              <div className="space-y-1.5 flex-1">
                <Label>Unit Number</Label>
                <Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} required />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label>Owner Name</Label>
                <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="submit">Add</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.unit_number}</TableCell>
                <TableCell>{u.owner_name || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => remove(u.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
