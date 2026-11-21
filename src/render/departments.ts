/** Colour per department, pulled from props in the room: the mug, the clock, the plant. */
export const DEPARTMENT_COLOR: Record<string, string> = {
  "sales-marketing": "#9e6656",
  finance: "#a8904f",
  hr: "#5f7894",
  manufacturing: "#557a5c",
};

export const departmentColor = (capabilityId: string | undefined) =>
  (capabilityId && DEPARTMENT_COLOR[capabilityId]) || "#48675b";

/** Short names for the directory's tabs. */
export const DEPARTMENT_SHORT: Record<string, string> = {
  "sales-marketing": "Sales",
  finance: "Finance",
  hr: "HR",
  manufacturing: "Mfg.",
};
