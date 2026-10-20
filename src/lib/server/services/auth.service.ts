import { prisma } from '@/lib/server/prisma';
import { genId } from '@/lib/server/gen-id';
import { toUserDto } from '@/lib/server/mappers/user.mapper';
import { REGISTER_DEFAULT_PERMISSIONS } from '@/lib/server/services/users.helpers';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function registerPassword(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { username, password } = body;
  if (!username || !password) {
    return { status: 400, body: { error: 'Username and password are required' } };
  }

  const cleanUsername = String(username).trim().toLowerCase();

  const oracleUser = await prisma.oracleWmsUser.findFirst({
    where: { username: { equals: cleanUsername, mode: 'insensitive' } },
  });
  if (!oracleUser) {
    return { status: 400, body: { error: 'User is not verified with Oracle WMS' } };
  }

  const existing = await prisma.userAccount.findFirst({
    where: { username: { equals: cleanUsername, mode: 'insensitive' } },
  });

  const now = new Date();
  let saved;

  if (existing) {
    saved = await prisma.userAccount.update({
      where: { id: existing.id },
      data: {
        passwordHash: String(password),
        hasAppPassword: true,
        oracleVerified: true,
        oracleVerifiedAt: now,
        updatedAt: now,
      },
    });
  } else {
    saved = await prisma.userAccount.create({
      data: {
        id: genId('USR'),
        username: oracleUser.username,
        fullName: oracleUser.fullName,
        email: oracleUser.email,
        role: 'Operations',
        passwordHash: String(password),
        hasAppPassword: true,
        assignedFaco: [{ companyId: 'COMP-01', facilityId: 'FAC-01' }],
        screenPermissions: REGISTER_DEFAULT_PERMISSIONS,
        oracleVerified: true,
        oracleVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Password established successfully. You can now login.',
      user: toUserDto(saved),
    },
  };
}

export async function login(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { username, password } = body;
  if (!username || !password) {
    return { status: 400, body: { error: 'Username and password are required' } };
  }

  const cleanUsername = String(username).trim().toLowerCase();

  const user = await prisma.userAccount.findFirst({
    where: { username: { equals: cleanUsername, mode: 'insensitive' } },
  });

  if (!user) {
    const oracleUser = await prisma.oracleWmsUser.findFirst({
      where: { username: { equals: cleanUsername, mode: 'insensitive' } },
    });
    if (oracleUser) {
      return {
        status: 403,
        body: {
          error: 'User exists in Oracle WMS but needs to create an app password first.',
          requiresPasswordSetup: true,
        },
      };
    }
    return { status: 401, body: { error: 'Invalid username or user not found in warehouse registry' } };
  }

  if (user.passwordHash !== String(password)) {
    return { status: 401, body: { error: 'Incorrect password entered' } };
  }

  return { status: 200, body: { success: true, user: toUserDto(user) } };
}
