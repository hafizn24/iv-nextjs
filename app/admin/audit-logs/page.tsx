"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Nav } from "@/components/nav";
import { api, formatDate } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Log = {
  id: number;
  user: string | null;
  action: string;
  entity: string;
  entity_id: number | null;
  detail: Record<string, unknown>;
  created_at: string;
};

export default function AuditLogsPage() {
  useAuth("admin");
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    api("/audit-logs").then(setLogs).catch(() => {});
  }, []);

  return (
    <div>
      <Nav links={[]} />
      <main className="mx-auto max-w-5xl p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                <TableCell>{l.user || "—"}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>{l.entity}{l.entity_id ? ` #${l.entity_id}` : ""}</TableCell>
                <TableCell className="max-w-md truncate text-xs text-gray-500">
                  {JSON.stringify(l.detail)}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">No audit logs yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
