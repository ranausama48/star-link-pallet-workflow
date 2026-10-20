import type { UserAccount } from '@/types';

type PrismaUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  passwordHash: string;
  hasAppPassword: boolean;
  assignedFaco: unknown;
  screenPermissions: unknown;
  oracleVerified: boolean;
  oracleVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserDto(user: PrismaUser): UserAccount {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role as UserAccount['role'],
    hasAppPassword: user.hasAppPassword,
    assignedFaco: user.assignedFaco as UserAccount['assignedFaco'],
    screenPermissions: user.screenPermissions as UserAccount['screenPermissions'],
    oracleVerified: user.oracleVerified,
    oracleVerifiedAt: user.oracleVerifiedAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toSafeUser(user: PrismaUser | UserAccount): UserAccount {
  if ('passwordHash' in user && user.createdAt instanceof Date) {
    return toUserDto(user as PrismaUser);
  }
  const { passwordHash: _p, ...safe } = user as UserAccount & { passwordHash?: string };
  return safe;
}
