import { prisma } from '@/lib/server/prisma';

export async function replaceFacilityCompanies(facilityId: string, companyIds: string[]) {
  const unique = [...new Set(companyIds.filter(Boolean))];
  await prisma.$transaction([
    prisma.facilityCompany.deleteMany({ where: { facilityId } }),
    ...(unique.length > 0
      ? [
          prisma.facilityCompany.createMany({
            data: unique.map((companyId) => ({ facilityId, companyId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
  return unique;
}

export async function companyIdsForFacility(facilityId: string, primaryCompanyId: string) {
  const links = await prisma.facilityCompany.findMany({ where: { facilityId } });
  if (links.length === 0) return [primaryCompanyId];
  return links.map((l) => l.companyId);
}
