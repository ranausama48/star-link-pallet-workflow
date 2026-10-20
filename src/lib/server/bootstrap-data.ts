import { computeSohRecords } from '@/lib/server/analytics-soh';
import { loadWarehouseDb } from '@/lib/server/warehouse-sync';

export async function getBootstrapPayload() {
  const db = await loadWarehouseDb();

  const companies = (db.companies || []).map((c) => ({
    ...c,
    status: c.status || 'ACTIVE',
  }));

  const facilities = (db.facilities || []).map((f) => ({
    ...f,
    companyIds:
      f.companyIds && Array.isArray(f.companyIds) && f.companyIds.length > 0
        ? f.companyIds
        : f.companyId
          ? [f.companyId]
          : [],
    status: f.status || 'ACTIVE',
  }));

  const users = (db.users || []).map(({ passwordHash: _ph, ...u }) => u);

  const transactions = [...db.transactions].sort(
    (a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime()
  );

  return {
    companies,
    facilities,
    palletTypes: db.palletTypes || [],
    docRefTypes: db.docRefTypes || [],
    transactions,
    sohRecords: computeSohRecords(db),
    oracleConfig: db.oracleConfig || {},
    oracleUsers: db.oracleUsers || [],
    users,
  };
}
