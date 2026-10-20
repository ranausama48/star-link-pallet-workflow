import { prisma } from '@/lib/server/prisma';
import { genId } from '@/lib/server/gen-id';
import { toFacilityDto } from '@/lib/server/mappers/facility.mapper';
import {
  companyIdsForFacility,
  replaceFacilityCompanies,
} from '@/lib/server/repositories/facility.repository';
import { loadWarehouseDb } from '@/lib/server/warehouse-sync';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function createCompany(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { code, name, status } = body;
  if (!code || !name) {
    return { status: 400, body: { error: 'Code and name are required' } };
  }

  const newComp = await prisma.company.create({
    data: {
      id: genId('COMP'),
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
  });

  return { status: 200, body: { success: true, company: newComp } };
}

export async function updateCompany(id: string, body: Record<string, unknown>): Promise<ServiceResponse> {
  const comp = await prisma.company.findUnique({ where: { id } });
  if (!comp) {
    return { status: 404, body: { error: 'Company not found' } };
  }

  const { code, name, status } = body;
  const updated = await prisma.company.update({
    where: { id },
    data: {
      ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    },
  });

  return { status: 200, body: { success: true, company: updated } };
}

export async function createFacility(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { companyId, companyIds, code, name, city, status } = body;
  const assignedCompanyIds: string[] =
    Array.isArray(companyIds) && companyIds.length > 0
      ? (companyIds as string[])
      : companyId
        ? [String(companyId)]
        : [];

  if (assignedCompanyIds.length === 0 || !code || !name) {
    return { status: 400, body: { error: 'At least one Company, facility code, and name are required' } };
  }

  const primary = assignedCompanyIds[0];
  const created = await prisma.facility.create({
    data: {
      id: genId('FAC'),
      primaryCompanyId: primary,
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      city: city ? String(city).trim() : 'Warehouse Center',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
  });

  await replaceFacilityCompanies(created.id, assignedCompanyIds);
  const dto = toFacilityDto(created, assignedCompanyIds);

  return { status: 200, body: { success: true, facility: dto } };
}

export async function updateFacility(id: string, body: Record<string, unknown>): Promise<ServiceResponse> {
  const fac = await prisma.facility.findUnique({ where: { id } });
  if (!fac) {
    return { status: 404, body: { error: 'Facility not found' } };
  }

  const { code, name, city, companyId, companyIds, status } = body;
  let nextCompanyIds = await companyIdsForFacility(fac.id, fac.primaryCompanyId);

  if (companyIds !== undefined && Array.isArray(companyIds)) {
    nextCompanyIds = companyIds as string[];
  } else if (companyId !== undefined) {
    nextCompanyIds = nextCompanyIds.length > 0 ? nextCompanyIds : [String(companyId)];
    if (!nextCompanyIds.includes(String(companyId))) {
      nextCompanyIds = [String(companyId), ...nextCompanyIds];
    }
  }

  const primary =
    nextCompanyIds.length > 0 ? nextCompanyIds[0] : fac.primaryCompanyId;

  const updated = await prisma.facility.update({
    where: { id },
    data: {
      ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(city !== undefined ? { city: String(city).trim() } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
      primaryCompanyId: primary,
    },
  });

  if (companyIds !== undefined || companyId !== undefined) {
    await replaceFacilityCompanies(id, nextCompanyIds);
  }

  const ids = await companyIdsForFacility(updated.id, updated.primaryCompanyId);
  return { status: 200, body: { success: true, facility: toFacilityDto(updated, ids) } };
}

export async function bulkUploadCompaniesFacilities(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { rows } = body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: 400, body: { error: 'No valid rows provided for bulk upload' } };
  }

  let companiesAdded = 0;
  let facilitiesAdded = 0;

  for (const row of rows as Record<string, unknown>[]) {
    const compCode = String(row.companyCode || row.CompanyCode || row.company || '')
      .trim()
      .toUpperCase();
    const compName = String(row.companyName || row.CompanyName || compCode).trim();
    const facCode = String(row.facilityCode || row.FacilityCode || row.facility || '')
      .trim()
      .toUpperCase();
    const facName = String(row.facilityName || row.FacilityName || facCode).trim();
    const city = String(row.city || row.City || 'Central Hub').trim();

    if (!compCode || !facCode) continue;

    let company = await prisma.company.findUnique({ where: { code: compCode } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: genId('COMP'),
          code: compCode,
          name: compName || compCode,
          status: 'ACTIVE',
        },
      });
      companiesAdded++;
    }

    const existingFac = await prisma.facility.findFirst({
      where: { code: facCode, primaryCompanyId: company.id },
    });

    if (!existingFac) {
      const fac = await prisma.facility.create({
        data: {
          id: genId('FAC'),
          primaryCompanyId: company.id,
          code: facCode,
          name: facName || facCode,
          city,
          status: 'ACTIVE',
        },
      });
      await replaceFacilityCompanies(fac.id, [company.id]);
      facilitiesAdded++;
    }
  }

  const db = await loadWarehouseDb();
  return {
    status: 200,
    body: {
      success: true,
      message: `Bulk processed: ${companiesAdded} companies and ${facilitiesAdded} facilities added/updated.`,
      companies: db.companies,
      facilities: db.facilities,
    },
  };
}
