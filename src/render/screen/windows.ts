import {
  Globe,
  FileBadge,
  FileCheck,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Mail,
  Network,
  Ticket,
} from "lucide-react";

import type { AppWindowId, WindowId } from "./screen";

export const WINDOW_ICONS: Record<WindowId, typeof Ticket> = {
  ticket: Ticket,
  catalog: LayoutGrid,
  mail: Mail,
  org: Network,
  guardrails: Globe,
  businessCase: FileText,
  vendorSheet: FileSpreadsheet,
  certificate: FileBadge,
  worksCouncil: FileCheck,
};

/** The apps on the desktop, in taskbar order, and the day each is first needed. */
export const APPS: { id: "ticket" | AppWindowId; label: string; from: number }[] = [
  { id: "ticket", label: "Service desk", from: 1 },
  { id: "catalog", label: "Service catalog", from: 6 },
  { id: "mail", label: "Mail", from: 1 },
  { id: "org", label: "Org chart", from: 1 },
  { id: "guardrails", label: "EA guardrails", from: 8 },
];
