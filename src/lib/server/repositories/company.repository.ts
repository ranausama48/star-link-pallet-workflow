import { prisma } from '@/lib/server/prisma';
import type { Prisma } from '@prisma/client';

export function findCompanyByCode(code: string) {
  return prisma.company.findUnique({ where: { code } });
}

export function createCompany(data: Prisma.CompanyCreateInput) {
  return prisma.company.create({ data });
}

export function updateCompany(id: string, data: Prisma.CompanyUpdateInput) {
  return prisma.company.update({ where: { id }, data });
}
