/** Minimal dependency-free CSV serializer — escapes quotes, commas, and newlines per RFC 4180. */
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(','));
  return [header, ...body].join('\n');
}
