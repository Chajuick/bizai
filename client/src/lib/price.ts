export function formatPrice(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return value.toLocaleString("ko-KR");
}

export function parsePrice(input: string): number | null {
  const numeric = input.replace(/[^\d]/g, "");
  if (!numeric) return null;
  return Number(numeric);
}