import type { WarehouseDb } from '@/lib/server/types/warehouse-db';

export function computeSohRecords(
  db: WarehouseDb,
  filters?: { companyId?: string; facilityId?: string }
) {
  let targetFacilities = [...db.facilities];
  if (filters?.facilityId) {
    targetFacilities = targetFacilities.filter((f) => f.id === filters.facilityId);
  } else if (filters?.companyId) {
    targetFacilities = targetFacilities.filter((f) => f.companyId === filters.companyId);
  }

  const sohRecords: Array<Record<string, unknown>> = [];

  targetFacilities.forEach((facility) => {
    const company = db.companies.find((c) => c.id === facility.companyId);

    db.palletTypes.forEach((pallet) => {
      const facTxns = db.transactions.filter(
        (t) => t.facilityId === facility.id && t.palletTypeId === pallet.id
      );

      const totalInbound = facTxns
        .filter((t) => t.type === 'INBOUND')
        .reduce((sum, t) => sum + Number(t.qty), 0);

      const totalOutbound = facTxns
        .filter((t) => t.type === 'OUTBOUND')
        .reduce((sum, t) => sum + Number(t.qty), 0);

      const currentSOH = totalInbound - totalOutbound;

      const lastTxn = [...facTxns].sort(
        (a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime()
      )[0];

      sohRecords.push({
        companyId: company?.id || facility.companyId,
        companyCode: company?.code || '',
        companyName: company?.name || '',
        facilityId: facility.id,
        facilityCode: facility.code,
        facilityName: facility.name,
        palletTypeId: pallet.id,
        palletTypeCode: pallet.code,
        palletTypeName: pallet.name,
        totalInbound,
        totalOutbound,
        currentSOH,
        lastMovementTime: lastTxn ? lastTxn.timestamp : null,
      });
    });
  });

  return sohRecords;
}
