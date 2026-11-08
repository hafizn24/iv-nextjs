// Plug-and-play mock backend. To remove: delete this file and set
// NEXT_PUBLIC_USE_MOCK=0 in .env.local (or remove the var). Nothing else changes.

type MockState = {
  users: { id: number; username: string; full_name: string; role: "admin" | "guard"; is_active: boolean; password: string }[];
  units: { id: number; unit_number: string; owner_name: string; active: boolean }[];
  slots: { id: number; slot_number: string; is_occupied: boolean; current_visitor_id: number | null }[];
  visitors: Record<string, unknown>[];
  logs: { id: number; user: string | null; action: string; entity: string; entity_id: number | null; detail: Record<string, unknown>; created_at: string }[];
  nextId: number;
};

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function seed(): MockState {
  const state: MockState = {
    users: [
      { id: 1, username: "admin", full_name: "System Admin", role: "admin", is_active: true, password: "admin123" },
      { id: 2, username: "guard", full_name: "Ali Bin Abu", role: "guard", is_active: true, password: "guard123" },
    ],
    units: [
      { id: 1, unit_number: "10-01", owner_name: "Tan Wei Ming", active: true },
      { id: 2, unit_number: "10-02", owner_name: "Siti Nurhaliza", active: true },
      { id: 3, unit_number: "12-05", owner_name: "Rajesh Kumar", active: true },
    ],
    slots: [
      { id: 1, slot_number: "A1", is_occupied: true, current_visitor_id: 2 },
      { id: 2, slot_number: "A2", is_occupied: false, current_visitor_id: null },
      { id: 3, slot_number: "A3", is_occupied: false, current_visitor_id: null },
      { id: 4, slot_number: "B1", is_occupied: false, current_visitor_id: null },
    ],
    visitors: [
      {
        id: 1, full_name: "Lim Chee Keong", nric_number: "850412-14-5521", nric_image_path: "mock",
        nric_image_url: null, unit_id: 1, purpose: "Aircond servicing", parking_slot_id: null,
        check_in_at: hoursAgo(3), check_out_at: hoursAgo(1), created_by_name: "Ali Bin Abu",
      },
      {
        id: 2, full_name: "Nur Aisyah Binti Omar", nric_number: "910225-08-6634", nric_image_path: "mock",
        nric_image_url: null, unit_id: 2, purpose: "Food delivery", parking_slot_id: 1,
        check_in_at: hoursAgo(1), check_out_at: null, created_by_name: "Ali Bin Abu",
      },
    ],
    logs: [],
    nextId: 100,
  };
  state.logs.push(
    { id: 1, user: "Ali Bin Abu", action: "checkin", entity: "visitor", entity_id: 2, detail: { full_name: "Nur Aisyah Binti Omar", slot: 1 }, created_at: hoursAgo(1) },
    { id: 2, user: "Ali Bin Abu", action: "checkout", entity: "visitor", entity_id: 1, detail: { full_name: "Lim Chee Keong" }, created_at: hoursAgo(1) },
  );
  return state;
}

const state = seed();
let actor = state.users[0].full_name; // set on mock login

function log(action: string, entity: string, entity_id: number | null, detail: Record<string, unknown> = {}) {
  state.logs.unshift({ id: state.nextId++, user: actor, action, entity, entity_id, detail, created_at: now() });
}

const ocrFixtures = [
  { full_name: "Muhammad Danial Bin Ismail", nric_number: "950311-10-5477" },
  { full_name: "Chong Mei Ling", nric_number: "881219-04-5210" },
  { full_name: "Ananda Raj A/L Selvam", nric_number: "921104-07-5033" },
];

function withNames(v: Record<string, unknown>) {
  return {
    ...v,
    unit_number: state.units.find((u) => u.id === v.unit_id)?.unit_number ?? null,
    parking_slot_number: state.slots.find((s) => s.id === v.parking_slot_id)?.slot_number ?? null,
  };
}

export function mockRequest(path: string, options: RequestInit): unknown {
  const body = (typeof options.body === "string" ? JSON.parse(options.body) : {}) as Record<string, unknown>;
  const url = new URL(path, "http://x");
  const [root, second, third] = url.pathname.replace(/^\/+|\/+$/g, "").split("/");

  if (root === "auth" && second === "login") {
    const found = state.users.find((u) => u.username === body.username && u.password === body.password && u.is_active);
    if (!found) throw new Error("Invalid credentials");
    actor = found.full_name;
    log("login", "user", found.id);
    return { token: `mock.${found.id}`, user: { id: found.id, username: found.username, full_name: found.full_name, role: found.role } };
  }
  if (root === "auth" && second === "me") {
    const me = state.users.find((u) => u.full_name === actor)!;
    return { id: me.id, username: me.username, full_name: me.full_name, role: me.role };
  }

  if (root === "visitors") {
    if (second === "upload") return { nric_image_path: `mock/${state.nextId++}.jpg` };
    if (second === "ocr") return ocrFixtures[Math.floor(Math.random() * ocrFixtures.length)];
    if (second === "check-in") {
      const v: Record<string, unknown> = {
        id: state.nextId++,
        full_name: String(body.full_name),
        nric_number: String(body.nric_number || ""),
        nric_image_path: String(body.nric_image_path),
        nric_image_url: null,
        unit_id: body.unit_id ?? null,
        purpose: String(body.purpose || ""),
        parking_slot_id: body.parking_slot_id ?? null,
        check_in_at: now(),
        check_out_at: null,
        created_by_name: actor,
      };
      state.visitors.unshift(v);
      if (v.parking_slot_id) {
        const s = state.slots.find((x) => x.id === v.parking_slot_id)!;
        s.is_occupied = true;
        s.current_visitor_id = v.id as number;
      }
      log("checkin", "visitor", v.id as number, { full_name: v.full_name, slot: v.parking_slot_id });
      return withNames(v);
    }
    if (third === "check-out") {
      const v = state.visitors.find((x) => x.id === Number(second));
      if (!v || v.check_out_at) throw new Error("Visitor not checked in");
      v.check_out_at = now();
      if (v.parking_slot_id) {
        const s = state.slots.find((x) => x.id === v.parking_slot_id);
        if (s) { s.is_occupied = false; s.current_visitor_id = null; }
      }
      log("checkout", "visitor", v.id as number, { full_name: v.full_name });
      return withNames(v);
    }
    const isAdmin = state.users.find((u) => u.full_name === actor)?.role === "admin";
    let list = isAdmin ? [...state.visitors] : state.visitors.filter((v) => !v.check_out_at);
    const search = url.searchParams.get("search")?.toLowerCase();
    if (search) list = list.filter((v) => String(v.full_name).toLowerCase().includes(search) || String(v.nric_number).includes(search));
    return list.map(withNames);
  }

  if (root === "parking-slots") {
    if (second === "available") return state.slots.filter((s) => !s.is_occupied);
    if (second) {
      const id = Number(second);
      const idx = state.slots.findIndex((s) => s.id === id);
      if (idx >= 0) {
        log("delete_parking_slot", "parking_slot", id, { slot_number: state.slots[idx].slot_number });
        state.slots.splice(idx, 1);
      }
      return null;
    }
    if (options.method === "POST") {
      const slot = { id: state.nextId++, slot_number: String(body.slot_number), is_occupied: false, current_visitor_id: null };
      state.slots.push(slot);
      log("create_parking_slot", "parking_slot", slot.id, { slot_number: slot.slot_number });
      return slot;
    }
    return state.slots;
  }

  if (root === "units") {
    if (options.method === "POST") {
      const u = { id: state.nextId++, unit_number: String(body.unit_number), owner_name: String(body.owner_name || ""), active: true };
      state.units.push(u);
      log("create_unit", "unit", u.id, { unit_number: u.unit_number });
      return u;
    }
    if (!second) return state.units;
    const id = Number(second);
    const idx = state.units.findIndex((u) => u.id === id);
    if (idx >= 0) {
      log("delete_unit", "unit", id, { unit_number: state.units[idx].unit_number });
      state.units.splice(idx, 1);
    }
    return null;
  }

  if (root === "users") {
    if (options.method === "POST") {
      if (state.users.some((u) => u.username === body.username)) throw new Error("username already exists");
      const u = {
        id: state.nextId++,
        username: String(body.username),
        full_name: String(body.full_name),
        role: (body.role as "admin" | "guard") || "guard",
        is_active: true,
        password: String(body.password),
      };
      state.users.push(u);
      log("create_user", "user", u.id, { username: u.username, role: u.role });
      return u;
    }
    if (second) {
      const u = state.users.find((x) => x.id === Number(second));
      if (u) {
        if (body.is_active !== undefined) u.is_active = Boolean(body.is_active);
        if (body.full_name) u.full_name = String(body.full_name);
        if (body.role) u.role = body.role as "admin" | "guard";
        log("update_user", "user", u.id, { changes: Object.keys(body) });
      }
      return u ?? null;
    }
    return state.users.map(({ password: _pw, ...u }) => u);
  }

  if (root === "audit-logs") return state.logs.slice(0, 200);

  throw new Error(`Mock: unknown endpoint ${options.method || "GET"} /${path}`);
}

export const MOCK_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK === "1";
