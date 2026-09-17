import { Router, type IRouter } from "express";
import {
  ChangeWasteStatusBody,
  ChangeWasteStatusParams,
  ChangeWasteStatusResponse,
  CreateWasteRecordBody,
  CreateWasteRecordResponse,
  GetDashboardResponse,
  GetWasteRecordParams,
  GetWasteRecordResponse,
  ListActivityQueryParams,
  ListActivityResponse,
  ListWasteRecordsQueryParams,
  ListWasteRecordsResponse,
  UpdateWasteRecordBody,
  UpdateWasteRecordParams,
  UpdateWasteRecordResponse,
} from "@workspace/api-zod";

type WasteStatus =
  | "draft"
  | "registered"
  | "collected"
  | "in_storage"
  | "assigned_transport"
  | "in_transit"
  | "delivered"
  | "in_treatment"
  | "disposed"
  | "completed";

type WasteRecord = {
  id: string;
  trackingId: string;
  category: string;
  source: string;
  quantity: number;
  unit: string;
  status: WasteStatus;
  createdAt: Date;
  dueDate: Date;
  handler: string | null;
  facility: string | null;
  risk?: "low" | "medium" | "high" | "critical";
};

const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 86400000);

const records: WasteRecord[] = [
  {
    id: "w-001",
    trackingId: "WR-2026-000124",
    category: "Solvent waste",
    source: "Organic Chemistry Lab",
    quantity: 42.5,
    unit: "L",
    status: "in_transit",
    createdAt: new Date("2026-09-10T08:14:00Z"),
    dueDate: new Date("2026-09-21"),
    handler: "Maya Chen",
    facility: "Northstar Treatment Facility",
    risk: "high",
  },
  {
    id: "w-002",
    trackingId: "WR-2026-000123",
    category: "Acidic aqueous",
    source: "Materials Research",
    quantity: 18,
    unit: "L",
    status: "registered",
    createdAt: new Date("2026-09-09T12:42:00Z"),
    dueDate: new Date("2026-09-18"),
    handler: "Aarav Patel",
    facility: null,
    risk: "critical",
  },
  {
    id: "w-003",
    trackingId: "WR-2026-000122",
    category: "Contaminated solids",
    source: "Clinical Diagnostics",
    quantity: 14,
    unit: "kg",
    status: "collected",
    createdAt: new Date("2026-09-06T09:25:00Z"),
    dueDate: new Date("2026-09-19"),
    handler: "Maya Chen",
    facility: "Northstar Treatment Facility",
    risk: "medium",
  },
  {
    id: "w-004",
    trackingId: "WR-2026-000121",
    category: "Heavy metal solution",
    source: "Analytical Services",
    quantity: 9.25,
    unit: "L",
    status: "in_storage",
    createdAt: new Date("2026-09-05T14:18:00Z"),
    dueDate: new Date("2026-09-22"),
    handler: "Lina Hoffmann",
    facility: null,
    risk: "high",
  },
  {
    id: "w-005",
    trackingId: "WR-2026-000120",
    category: "Flammable liquids",
    source: "Process Engineering",
    quantity: 76,
    unit: "L",
    status: "completed",
    createdAt: new Date("2026-08-28T07:06:00Z"),
    dueDate: new Date("2026-09-07"),
    handler: "Aarav Patel",
    facility: "Clearwater Disposal",
    risk: "high",
  },
  {
    id: "w-006",
    trackingId: "WR-2026-000119",
    category: "Biological waste",
    source: "Cell Biology Lab",
    quantity: 24,
    unit: "kg",
    status: "in_treatment",
    createdAt: new Date("2026-08-25T11:31:00Z"),
    dueDate: new Date("2026-09-17"),
    handler: "Maya Chen",
    facility: "BioSecure Treatment",
    risk: "critical",
  },
  {
    id: "w-007",
    trackingId: "WR-2026-000118",
    category: "Reactive solids",
    source: "Pilot Plant",
    quantity: 6.5,
    unit: "kg",
    status: "registered",
    createdAt: new Date("2026-08-22T16:04:00Z"),
    dueDate: new Date("2026-09-20"),
    handler: "Lina Hoffmann",
    facility: null,
    risk: "critical",
  },
  {
    id: "w-008",
    trackingId: "WR-2026-000117",
    category: "Acidic aqueous",
    source: "Polymer Synthesis",
    quantity: 31,
    unit: "L",
    status: "disposed",
    createdAt: new Date("2026-08-18T10:20:00Z"),
    dueDate: new Date("2026-09-02"),
    handler: "Aarav Patel",
    facility: "Clearwater Disposal",
    risk: "medium",
  },
];

const activities = [
  { id: "a-1", actor: "Maya Chen", action: "advanced", target: "WR-2026-000124 to In transit", timestamp: new Date("2026-09-17T09:42:00Z"), tone: "info" as const },
  { id: "a-2", actor: "Aarav Patel", action: "uploaded manifest", target: "WR-2026-000123", timestamp: new Date("2026-09-17T08:26:00Z"), tone: "success" as const },
  { id: "a-3", actor: "System", action: "flagged overdue collection", target: "WR-2026-000118", timestamp: new Date("2026-09-16T16:18:00Z"), tone: "warning" as const },
  { id: "a-4", actor: "Lina Hoffmann", action: "registered", target: "WR-2026-000117", timestamp: new Date("2026-09-16T14:08:00Z"), tone: "neutral" as const },
  { id: "a-5", actor: "Northstar Facility", action: "confirmed receipt", target: "WR-2026-000122", timestamp: new Date("2026-09-16T11:50:00Z"), tone: "success" as const },
];

const timelineFor = (record: WasteRecord) => [
  { id: `${record.id}-1`, status: "registered" as WasteStatus, label: "Record registered", actor: record.handler ?? "Operations team", timestamp: record.createdAt, note: null },
  ...(record.status !== "registered"
    ? [{ id: `${record.id}-2`, status: record.status, label: statusLabel(record.status), actor: record.handler ?? "Operations team", timestamp: new Date(record.createdAt.getTime() + 86400000), note: null }]
    : []),
];

const statusLabel = (status: WasteStatus) =>
  status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const detailFor = (record: WasteRecord) => ({
  ...record,
  timeline: timelineFor(record),
  documents: [
    { id: `${record.id}-manifest`, name: "Waste manifest", type: "Manifest", uploadedAt: record.createdAt, size: "248 KB" },
    ...(record.status === "completed" || record.status === "disposed"
      ? [{ id: `${record.id}-certificate`, name: "Disposal certificate", type: "Certificate", uploadedAt: new Date(record.createdAt.getTime() + 4 * 86400000), size: "182 KB" }]
      : []),
  ],
});

const router: IRouter = Router();

router.get("/dashboard", (_req, res): void => {
  const statusBreakdown = Array.from(
    new Set(records.map((record) => record.status)),
  ).map((status) => ({ status, count: records.filter((record) => record.status === status).length }));
  res.json(GetDashboardResponse.parse({
    metrics: {
      totalGenerated: records.reduce((sum, record) => sum + record.quantity, 0),
      pendingCollection: records.filter((record) => ["registered", "in_storage", "draft"].includes(record.status)).length,
      inTransit: records.filter((record) => record.status === "in_transit").length,
      pendingDisposal: records.filter((record) => ["delivered", "in_treatment", "disposed"].includes(record.status)).length,
      completed: records.filter((record) => record.status === "completed").length,
      overdue: records.filter((record) => record.dueDate < new Date() && record.status !== "completed").length,
    },
    statusBreakdown,
    activity: activities,
    compliance: { score: 91, missingDocuments: 3, expiringSoon: 5 },
  }));
});

router.get("/waste-records", (req, res): void => {
  const query = ListWasteRecordsQueryParams.parse(req.query);
  const normalizedSearch = query.search?.toLowerCase();
  const filtered = records.filter((record) => {
    const matchesStatus = !query.status || record.status === query.status;
    const matchesSearch =
      !normalizedSearch ||
      [record.trackingId, record.category, record.source, record.handler, record.facility]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  });
  const start = (query.page - 1) * query.pageSize;
  res.json(ListWasteRecordsResponse.parse({
    items: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
  }));
});

router.post("/waste-records", (req, res): void => {
  const body = CreateWasteRecordBody.parse(req.body);
  const sequence = records.length + 125;
  const record: WasteRecord = {
    id: `w-${sequence}`,
    trackingId: `WR-2026-${String(sequence).padStart(6, "0")}`,
    category: body.category,
    source: body.source,
    quantity: body.quantity,
    unit: body.unit,
    status: "registered",
    createdAt: new Date(),
    dueDate: body.dueDate,
    handler: body.handler ?? null,
    facility: body.facility ?? null,
    risk: body.risk ?? "medium",
  };
  records.unshift(record);
  res.status(201).json(CreateWasteRecordResponse.parse(record));
});

router.get("/waste-records/:id", (req, res): void => {
  const params = GetWasteRecordParams.parse(req.params);
  const record = records.find((item) => item.id === params.id);
  if (!record) {
    res.status(404).json({ error: "Waste record not found" });
    return;
  }
  res.json(GetWasteRecordResponse.parse(detailFor(record)));
});

router.patch("/waste-records/:id", (req, res): void => {
  const params = UpdateWasteRecordParams.parse(req.params);
  const body = UpdateWasteRecordBody.parse(req.body);
  const record = records.find((item) => item.id === params.id);
  if (!record) {
    res.status(404).json({ error: "Waste record not found" });
    return;
  }
  Object.assign(record, body);
  res.json(UpdateWasteRecordResponse.parse(record));
});

router.post("/waste-records/:id/status", (req, res): void => {
  const params = ChangeWasteStatusParams.parse(req.params);
  const body = ChangeWasteStatusBody.parse(req.body);
  const record = records.find((item) => item.id === params.id);
  if (!record) {
    res.status(404).json({ error: "Waste record not found" });
    return;
  }
  record.status = body.status;
  activities.unshift({
    id: `a-${activities.length + 1}`,
    actor: "Current user",
    action: "advanced",
    target: `${record.trackingId} to ${statusLabel(body.status)}`,
    timestamp: new Date(),
    tone: "info",
  });
  res.json(ChangeWasteStatusResponse.parse(detailFor(record)));
});

router.get("/activity", (req, res): void => {
  const query = ListActivityQueryParams.parse(req.query);
  res.json(ListActivityResponse.parse(activities.slice(0, query.pageSize)));
});

export default router;