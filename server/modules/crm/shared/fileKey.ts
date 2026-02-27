// server/modules/crm/shared/fileKey.ts

// #region Utils
export function buildFilePath(args: { comp_idno: number; user_idno: number; file_name: string }) {
  const safe = args.file_name.replace(/[^\w.\-() ]+/g, "_");
  const ymd = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = Math.random().toString(36).slice(2, 10);
  return `comp_${args.comp_idno}/user_${args.user_idno}/${ymd}/${rand}_${safe}`;
}

export function getExt(file_name: string): string | null {
  const i = file_name.lastIndexOf(".");
  if (i <= 0) return null;
  const ext = file_name.slice(i + 1).toLowerCase();
  return ext.length ? ext : null;
}
// #endregion