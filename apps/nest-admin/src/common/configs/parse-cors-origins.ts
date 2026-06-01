export function parseCorsOrigins(raw: string | undefined): string[] {
    return (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}
