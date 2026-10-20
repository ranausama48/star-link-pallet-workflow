import { prisma } from '@/lib/server/prisma';
import type { WarehouseDb } from '@/lib/server/types/warehouse-db';

function mapOracleConfigToClient(config: Record<string, unknown>) {
  const out = { ...config };
  if (!out.apiUrl && typeof out.orderApiUrl === 'string') {
    out.apiUrl = out.orderApiUrl;
  }
  return out;
}

export async function loadWarehouseDb(): Promise<WarehouseDb> {
  const [
    companies,
    facilities,
    facilityLinks,
    palletTypes,
    docRefTypes,
    users,
    oracleUsers,
    oracleConfigRow,
    transactions,
  ] = await Promise.all([
    prisma.company.findMany(),
    prisma.facility.findMany(),
    prisma.facilityCompany.findMany(),
    prisma.palletType.findMany(),
    prisma.docRefType.findMany(),
    prisma.userAccount.findMany(),
    prisma.oracleWmsUser.findMany(),
    prisma.oracleWmsConfig.findUnique({ where: { id: 'default' } }),
    prisma.palletTransaction.findMany({ orderBy: { timestamp: 'desc' } }),
  ]);

  const linksByFacility = new Map<string, string[]>();
  for (const link of facilityLinks) {
    const list = linksByFacility.get(link.facilityId) ?? [];
    list.push(link.companyId);
    linksByFacility.set(link.facilityId, list);
  }

  return {
    oracleConfig: mapOracleConfigToClient(
      (oracleConfigRow?.config as Record<string, unknown>) ?? {}
    ),
    oracleUsers: oracleUsers.map((u) => ({ ...u })),
    companies: companies.map((c) => ({ ...c })),
    facilities: facilities.map((f) => {
      const companyIds =
        linksByFacility.get(f.id)?.length ? linksByFacility.get(f.id)! : [f.primaryCompanyId];
      return {
        id: f.id,
        code: f.code,
        name: f.name,
        city: f.city,
        status: f.status,
        companyId: f.primaryCompanyId,
        companyIds,
      };
    }),
    palletTypes: palletTypes.map((p) => ({ ...p })),
    docRefTypes: docRefTypes.map((d) => ({ ...d })),
    users: users.map((u) => ({
      ...u,
      assignedFaco: u.assignedFaco,
      screenPermissions: u.screenPermissions,
      oracleVerifiedAt: u.oracleVerifiedAt?.toISOString(),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
    })),
  };
}

/**
 * Full-table wipe and re-import. Use only for db reset, seed, and local baseline restore —
 * not for routine API mutations.
 * @deprecated for application writes; use Prisma services instead.
 */
export async function saveWarehouseDb(db: WarehouseDb): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.palletTransaction.deleteMany();
      await tx.facilityCompany.deleteMany();
      await tx.facility.deleteMany();
      await tx.company.deleteMany();
      await tx.palletType.deleteMany();
      await tx.docRefType.deleteMany();
      await tx.userAccount.deleteMany();
      await tx.oracleWmsUser.deleteMany();

      for (const c of db.companies ?? []) {
        await tx.company.create({
          data: {
            id: String(c.id),
            code: String(c.code),
            name: String(c.name),
            status: String(c.status ?? 'ACTIVE'),
          },
        });
      }

      for (const f of db.facilities ?? []) {
        const companyIds =
          Array.isArray(f.companyIds) && f.companyIds.length > 0
            ? (f.companyIds as string[])
            : f.companyId
              ? [String(f.companyId)]
              : [];
        const primaryCompanyId = companyIds[0] ?? String(f.companyId);
        await tx.facility.create({
          data: {
            id: String(f.id),
            code: String(f.code),
            name: String(f.name),
            city: String(f.city ?? 'Warehouse Center'),
            status: String(f.status ?? 'ACTIVE'),
            primaryCompanyId,
          },
        });
        for (const companyId of companyIds) {
          await tx.facilityCompany.create({
            data: { facilityId: String(f.id), companyId: String(companyId) },
          });
        }
      }

      for (const p of db.palletTypes ?? []) {
        await tx.palletType.create({
          data: {
            id: String(p.id),
            code: String(p.code),
            name: String(p.name),
            material: String(p.material ?? 'Wood'),
            lengthCm: Number(p.lengthCm ?? 120),
            widthCm: Number(p.widthCm ?? 100),
            heightCm: Number(p.heightCm ?? 15),
            tareWeightKg: Number(p.tareWeightKg ?? 20),
            maxLoadKg: Number(p.maxLoadKg ?? 1500),
            color: p.color ? String(p.color) : null,
            status: String(p.status ?? 'ACTIVE'),
          },
        });
      }

      for (const d of db.docRefTypes ?? []) {
        await tx.docRefType.create({
          data: {
            id: String(d.id),
            code: String(d.code),
            name: String(d.name),
            description: String(d.description ?? ''),
            patternMask: d.patternMask ? String(d.patternMask) : null,
            status: String(d.status ?? 'ACTIVE'),
          },
        });
      }

      for (const u of db.users ?? []) {
        await tx.userAccount.create({
          data: {
            id: String(u.id),
            username: String(u.username),
            fullName: String(u.fullName),
            email: String(u.email),
            role: String(u.role),
            passwordHash: String(u.passwordHash ?? ''),
            hasAppPassword: Boolean(u.hasAppPassword),
            assignedFaco: u.assignedFaco as object,
            screenPermissions: u.screenPermissions as object,
            oracleVerified: Boolean(u.oracleVerified),
            oracleVerifiedAt: u.oracleVerifiedAt ? new Date(String(u.oracleVerifiedAt)) : null,
            createdAt: new Date(String(u.createdAt ?? new Date().toISOString())),
            updatedAt: new Date(String(u.updatedAt ?? new Date().toISOString())),
          },
        });
      }

      for (const ou of db.oracleUsers ?? []) {
        await tx.oracleWmsUser.create({
          data: {
            username: String(ou.username),
            fullName: String(ou.fullName),
            email: String(ou.email),
            department: String(ou.department),
            oracleRole: String(ou.oracleRole),
            status: String(ou.status),
          },
        });
      }

      const oracleConfig = { ...(db.oracleConfig ?? {}) };
      await tx.oracleWmsConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', config: oracleConfig as object },
        update: { config: oracleConfig as object },
      });

      for (const t of db.transactions ?? []) {
        await tx.palletTransaction.create({
          data: {
            id: String(t.id),
            type: String(t.type),
            source: String(t.source),
            sourceLabel: String(t.sourceLabel),
            companyId: String(t.companyId),
            companyCode: String(t.companyCode),
            companyName: String(t.companyName),
            facilityId: String(t.facilityId),
            facilityCode: String(t.facilityCode),
            facilityName: String(t.facilityName),
            docRefTypeId: String(t.docRefTypeId),
            docRefTypeName: String(t.docRefTypeName),
            docRefNumber: String(t.docRefNumber),
            palletTypeId: String(t.palletTypeId),
            palletTypeCode: String(t.palletTypeCode),
            palletTypeName: String(t.palletTypeName),
            qty: Number(t.qty),
            notes: String(t.notes ?? ''),
            createdByUserId: String(t.createdByUserId),
            createdByUsername: String(t.createdByUsername),
            createdByName: String(t.createdByName),
            timestamp: new Date(String(t.timestamp)),
          },
        });
      }
    },
    { timeout: 120_000 }
  );
}

export async function upsertOracleConfig(config: Record<string, unknown>) {
  await prisma.oracleWmsConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', config: config as object },
    update: { config: config as object },
  });
}
