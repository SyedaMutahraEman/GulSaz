import { Prisma } from '@prisma/client';

export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(6, '0')}`;
}
