import type { Facility } from '@/types';

export function toFacilityDto(
  facility: {
    id: string;
    code: string;
    name: string;
    city: string;
    status: string;
    primaryCompanyId: string;
  },
  companyIds: string[]
): Facility {
  const ids = companyIds.length > 0 ? companyIds : [facility.primaryCompanyId];
  return {
    id: facility.id,
    code: facility.code,
    name: facility.name,
    city: facility.city,
    status: facility.status as Facility['status'],
    companyId: ids[0],
    companyIds: ids,
  };
}
