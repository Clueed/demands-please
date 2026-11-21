import type { AttachmentKind } from "@/game/types";

/** What each attachment is called in the ticket's file list. */
export const FILE_NAMES: Record<AttachmentKind, string> = {
  businessCase: "business-case.pdf",
  vendorSheet: "vendor-fact-sheet.pdf",
  certificate: "security-cert.pdf",
  worksCouncil: "works-council.pdf",
};

/** Window titles for each attachment. */
export const DOCUMENT_TITLES: Record<AttachmentKind, string> = {
  businessCase: "Business case",
  vendorSheet: "Vendor fact sheet",
  certificate: "Security certificate",
  worksCouncil: "Works council",
};
