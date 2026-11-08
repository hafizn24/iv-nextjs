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

type Slot = { id: number; slot_number: string; is_occupied: boolean; current_visitor_id: number | null };

export default function ParkingPage() {
  useAuth("admin");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotNumber, setSlotNumber] = useState("");

  const load = useCallback(async () => {
    setSlots(await api("/parking-slots"));
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/parking-slots", { method: "POST", body: JSON.stringify({ slot_number: slotNumber }) });
      setSlotNumber("");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    try {
      await api(`/parking-slots/${id}`, { method: "DELETE" });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <Nav links={[]} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <Card>
          <CardHeader><CardTitle>Add Parking Slot</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={add} className="flex gap-2 items-end">
              <div className="space-y-1.5 flex-1">
                <Label>Slot Number</Label>
                <Input value={slotNumber} onChange={(e) => setSlotNumber(e.target.value)} required />
              </div>
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.slot_number}</TableCell>
                <TableCell>
                  {s.is_occupied ? (
                    <span className="text-red-600">Occupied (visitor #{s.current_visitor_id})</span>
                  ) : (
                    <span className="text-green-600">Free</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => remove(s.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
