export const QUICK_QUANTITIES = ['1', '2', '3', '5', '0.5 kg', '1 kg'] as const;

const QUANTITY_WITH_UNIT_RE = /^(\d+(?:[.,]\d+)?)(?:\s*(.*))?$/;

export function isNumericQuantity(quantity: string | null): quantity is string {
  return quantity !== null && /^\d+(?:[.,]\d+)?$/.test(quantity.trim());
}

export function stepQuantity(quantity: string, delta: number): string {
  const match = quantity.trim().match(QUANTITY_WITH_UNIT_RE);
  if (!match) return quantity;

  const [, amount, unit = ''] = match;
  const normalized = Number.parseFloat(amount.replace(',', '.'));
  if (Number.isNaN(normalized)) return quantity;

  const nextValue = Math.max(1, normalized + delta);
  const formattedValue = Number.isInteger(nextValue) ? String(nextValue) : nextValue.toFixed(1).replace(/\.0$/, '');
  return unit ? `${formattedValue} ${unit.trim()}` : formattedValue;
}

export function buildItemInput(name: string, quantity: string | null): string {
  return quantity ? `${name} x${quantity}` : name;
}
