import { prisma } from '@/lib/server/prisma';
import type { Prisma } from '@prisma/client';

export function findUserByUsernameInsensitive(username: string) {
  return prisma.userAccount.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
}

export function createUser(data: Prisma.UserAccountCreateInput) {
  return prisma.userAccount.create({ data });
}

export function updateUser(id: string, data: Prisma.UserAccountUpdateInput) {
  return prisma.userAccount.update({ where: { id }, data });
}

export function deleteUser(id: string) {
  return prisma.userAccount.delete({ where: { id } });
}
