/**
 * Parses item input that may contain a quantity suffix or prefix.
 * Supports: "milk x3", "milk 3x", "3x milk", "milk (3)"
 * Returns { name, quantity } — quantity is null if not found.
 */
export function parseItemInput(raw: string): { name: string; quantity: string | null } {
  const s = raw.trim();

  // "3x milk" or "3 x milk"
  const prefixMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*[xX×]\s+(.+)$/);
  if (prefixMatch) return { name: prefixMatch[2].trim(), quantity: prefixMatch[1] };

  // "milk x3" or "milk x 3"
  const suffixXMatch = s.match(/^(.+?)\s+[xX×]\s*(\d+(?:[.,]\d+)?)$/);
  if (suffixXMatch) return { name: suffixXMatch[1].trim(), quantity: suffixXMatch[2] };

  // "milk (3)" or "milk (3kg)"
  const parenMatch = s.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenMatch) return { name: parenMatch[1].trim(), quantity: parenMatch[2].trim() };

  return { name: s, quantity: null };
}
