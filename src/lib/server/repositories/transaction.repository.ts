import { prisma } from '@/lib/server/prisma';
import type { Prisma } from '@prisma/client';

export function createTransaction(data: Prisma.PalletTransactionCreateInput) {
  return prisma.palletTransaction.create({ data });
}

export function createManyTransactions(data: Prisma.PalletTransactionCreateManyInput[]) {
  return prisma.palletTransaction.createMany({ data });
}
