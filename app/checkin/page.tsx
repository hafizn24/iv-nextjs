"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Nav } from "@/components/nav";
import { SearchableSelect } from "@/components/searchable-select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Unit = { id: number; unit_number: string; owner_name: string };
type Slot = { id: number; slot_number: string };

export default function CheckInPage() {
  useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    nric_number: "",
    unit_id: "",
    purpose: "",
    parking_slot_id: "",
    nric_image_path: "",
  });

  useEffect(() => {
    api("/units").then(setUnits).catch(() => {});
    api("/parking-slots/available").then(setSlots).catch(() => {});
  }, []);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
    setOcrBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", f);
      const up = await api("/visitors/upload", { method: "POST", body: fd });
      setForm((p) => ({ ...p, nric_image_path: up.nric_image_path }));
      const ocr = await api("/visitors/ocr", { method: "POST", body: fd });
      setForm((p) => ({ ...p, full_name: ocr.full_name || p.full_name, nric_number: ocr.nric_number || p.nric_number }));
      toast.success("NRIC scanned — please verify the details");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      toast.error(msg && msg !== "null" ? msg : "Something went wrong");
    } finally {
      setOcrBusy(false);
    }
  }

  function removeImage() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setForm((p) => ({ ...p, nric_image_path: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unit_id) return toast.error("Visiting unit is required");
    if (!form.purpose.trim()) return toast.error("Purpose is required");
    if (!form.nric_image_path) return toast.error("Capture NRIC image first");
    setSubmitting(true);
    try {
      await api("/visitors/check-in", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          unit_id: form.unit_id ? Number(form.unit_id) : null,
          parking_slot_id: form.parking_slot_id ? Number(form.parking_slot_id) : null,
        }),
      });
      toast.success("Visitor checked in");
      if (form.parking_slot_id) setSlots((s) => s.filter((x) => x.id !== Number(form.parking_slot_id)));
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setForm({ full_name: "", nric_number: "", unit_id: "", purpose: "", parking_slot_id: "", nric_image_path: "" });
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      toast.error(msg && msg !== "null" ? msg : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Nav links={[{ href: "/checkin", label: "Check In" }, { href: "/visitors", label: "Visitors" }]} />
      <main className="mx-auto max-w-xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Check-In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="image">NRIC Image (camera or file)</Label>
                <Input id="image" ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} />
                {ocrBusy && <p className="text-sm text-gray-500">Scanning NRIC…</p>}
                {file && !ocrBusy && <p className="text-sm text-green-600">Image uploaded ✓</p>}
                {preview && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="NRIC preview" className="max-h-48 rounded border" />
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={removeImage} disabled={ocrBusy}>
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>NRIC Number</Label>
                <Input value={form.nric_number} onChange={(e) => setForm({ ...form, nric_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Visiting Unit *</Label>
                <SearchableSelect
                  value={form.unit_id}
                  onValueChange={(v) => setForm({ ...form, unit_id: v })}
                  placeholder="Select unit"
                  options={units.map((u) => ({
                    value: String(u.id),
                    label: `${u.unit_number} ${u.owner_name ? `— ${u.owner_name}` : ""}`,
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Purpose *</Label>
                <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Parking Slot (optional)</Label>
                <SearchableSelect
                  value={form.parking_slot_id}
                  onValueChange={(v) => setForm({ ...form, parking_slot_id: v })}
                  placeholder="No parking"
                  emptyText="No free slots"
                  options={slots.map((s) => ({ value: String(s.id), label: s.slot_number }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || ocrBusy}>
                  {submitting ? "Saving..." : "Check In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
