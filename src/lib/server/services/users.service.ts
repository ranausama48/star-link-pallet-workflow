import { prisma } from '@/lib/server/prisma';
import { genId } from '@/lib/server/gen-id';
import { toUserDto } from '@/lib/server/mappers/user.mapper';
import { defaultPermissionsForRole } from '@/lib/server/services/users.helpers';
import type { UserRole } from '@/types';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function createUser(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { username, fullName, email, role, assignedFaco, screenPermissions, password } = body;

  if (!username || !role) {
    return { status: 400, body: { error: 'Username and role are required' } };
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const dup = await prisma.userAccount.findFirst({
    where: { username: { equals: cleanUsername, mode: 'insensitive' } },
  });
  if (dup) {
    return { status: 400, body: { error: 'A user with this username already exists' } };
  }

  const roleStr = String(role) as UserRole;
  const now = new Date();
  const created = await prisma.userAccount.create({
    data: {
      id: genId('USR'),
      username: cleanUsername,
      fullName: fullName ? String(fullName) : cleanUsername,
      email: email ? String(email) : `${cleanUsername}@starlinks-logistics.com`,
      role: roleStr,
      passwordHash: password ? String(password) : 'password123',
      hasAppPassword: Boolean(password),
      assignedFaco: (assignedFaco as object) ?? [{ companyId: 'COMP-01', facilityId: 'FAC-01' }],
      screenPermissions:
        (screenPermissions as object) ?? defaultPermissionsForRole(roleStr),
      oracleVerified: true,
      oracleVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  });

  return { status: 200, body: { success: true, user: toUserDto(created) } };
}

export async function updateUser(id: string, body: Record<string, unknown>): Promise<ServiceResponse> {
  const current = await prisma.userAccount.findUnique({ where: { id } });
  if (!current) {
    return { status: 404, body: { error: 'User not found' } };
  }

  const {
    username,
    fullName,
    email,
    role,
    assignedFaco,
    screenPermissions,
    password,
    hasAppPassword,
    oracleVerified,
    oracleVerifiedAt,
  } = body;

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (username !== undefined) data.username = String(username).trim().toLowerCase();
  if (fullName !== undefined) data.fullName = String(fullName);
  if (email !== undefined) data.email = String(email);
  if (role !== undefined) data.role = String(role);
  if (assignedFaco !== undefined) data.assignedFaco = assignedFaco;
  if (screenPermissions !== undefined) data.screenPermissions = screenPermissions;
  if (hasAppPassword !== undefined) data.hasAppPassword = Boolean(hasAppPassword);
  if (oracleVerified !== undefined) data.oracleVerified = Boolean(oracleVerified);
  if (oracleVerifiedAt !== undefined) {
    data.oracleVerifiedAt = oracleVerifiedAt ? new Date(String(oracleVerifiedAt)) : null;
  }
  if (password) {
    data.passwordHash = String(password);
    data.hasAppPassword = true;
  }

  const updated = await prisma.userAccount.update({
    where: { id },
    data: data as never,
  });

  return { status: 200, body: { success: true, user: toUserDto(updated) } };
}

export async function deleteUser(id: string): Promise<ServiceResponse> {
  const current = await prisma.userAccount.findUnique({ where: { id } });
  if (!current) {
    return { status: 404, body: { error: 'User not found' } };
  }

  if (current.username === 'obaidullah.r' || current.username === 'admin.starlinks') {
    return { status: 400, body: { error: 'Cannot delete primary root administrator' } };
  }

  await prisma.userAccount.delete({ where: { id } });
  return { status: 200, body: { success: true, message: `User ${current.username} deleted` } };
}
