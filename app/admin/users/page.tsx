"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type User = { id: number; username: string; full_name: string; role: string; is_active: boolean };

const empty = { username: "", full_name: "", password: "", role: "guard" };

export default function UsersPage() {
  useAuth("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setUsers(await api("/users"));
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setForm(empty);
      load();
      toast.success("User created");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function toggleActive(u: User) {
    try {
      await api(`/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !u.is_active }) });
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
          <CardHeader><CardTitle>Add User</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={add} className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guard">Guard</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Button type="submit">Add</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                    {u.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
