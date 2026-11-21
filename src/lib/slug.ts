/** "3D Print Studio" -> "3d-print-studio". Names app icon files, see scripts/icons/apps.ts. */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
