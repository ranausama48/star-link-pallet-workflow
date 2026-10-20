/**
 * Express API app — GET-only fallback until reads migrate to native Route Handlers.
 * Mutations use Prisma services under src/app/api/* (no saveWarehouseDb).
 */
// @ts-nocheck
import express, { type Request, type Response } from 'express';
import { loadWarehouseDb } from '@/lib/server/warehouse-sync';

const loadDb = () => loadWarehouseDb();

let cached: express.Application | null = null;

export function getApiApp(): express.Application {
  if (cached) return cached;
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.get('/api/health', async (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Starlinks Pallet Flow' });
  });

  app.get('/api/oracle-config', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.oracleConfig || {});
  });

  app.get('/api/oracle-wms/users', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.oracleUsers || []);
  });

  app.get('/api/users', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const safeUsers = db.users.map(({ passwordHash, ...u }: any) => u);
    res.json(safeUsers);
  });

  app.get('/api/companies-facilities', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const companies = (db.companies || []).map((c: any) => ({
      ...c,
      status: c.status || 'ACTIVE',
    }));
    const facilities = (db.facilities || []).map((f: any) => ({
      ...f,
      companyIds:
        f.companyIds && Array.isArray(f.companyIds) && f.companyIds.length > 0
          ? f.companyIds
          : f.companyId
            ? [f.companyId]
            : [],
      status: f.status || 'ACTIVE',
    }));
    res.json({
      companies,
      facilities,
    });
  });

  app.get('/api/pallet-types', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.palletTypes || []);
  });

  app.get('/api/doc-ref-types', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.docRefTypes || []);
  });

  app.get('/api/transactions', async (req: Request, res: Response) => {
    const db = await loadDb();
    let txns = [...db.transactions];

    const { type, companyId, facilityId, palletTypeId, user, startDate, endDate, source } = req.query;

    if (type) {
      txns = txns.filter((t: any) => t.type === String(type).toUpperCase());
    }
    if (companyId) {
      txns = txns.filter((t: any) => t.companyId === companyId);
    }
    if (facilityId) {
      txns = txns.filter((t: any) => t.facilityId === facilityId);
    }
    if (palletTypeId) {
      txns = txns.filter((t: any) => t.palletTypeId === palletTypeId);
    }
    if (source) {
      txns = txns.filter((t: any) => t.source === source);
    }
    if (user) {
      const q = String(user).toLowerCase();
      txns = txns.filter(
        (t: any) =>
          t.createdByUsername?.toLowerCase().includes(q) ||
          t.createdByName?.toLowerCase().includes(q)
      );
    }
    if (startDate) {
      const start = new Date(String(startDate)).getTime();
      txns = txns.filter((t: any) => new Date(t.timestamp).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(String(endDate)).getTime();
      txns = txns.filter((t: any) => new Date(t.timestamp).getTime() <= end);
    }

    txns.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(txns);
  });

  app.get('/api/analytics/soh', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { companyId, facilityId } = req.query;

    let targetFacilities = [...db.facilities];
    if (facilityId) {
      targetFacilities = targetFacilities.filter((f: any) => f.id === facilityId);
    } else if (companyId) {
      targetFacilities = targetFacilities.filter((f: any) => f.companyId === companyId);
    }

    const sohRecords: any[] = [];

    targetFacilities.forEach((facility: any) => {
      const company = db.companies.find((c: any) => c.id === facility.companyId);

      db.palletTypes.forEach((pallet: any) => {
        const facTxns = db.transactions.filter(
          (t: any) => t.facilityId === facility.id && t.palletTypeId === pallet.id
        );

        const totalInbound = facTxns
          .filter((t: any) => t.type === 'INBOUND')
          .reduce((sum: number, t: any) => sum + t.qty, 0);

        const totalOutbound = facTxns
          .filter((t: any) => t.type === 'OUTBOUND')
          .reduce((sum: number, t: any) => sum + t.qty, 0);

        const currentSOH = totalInbound - totalOutbound;

        const lastTxn = facTxns.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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

    res.json(sohRecords);
  });

  app.get('/api/analytics/overview', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const txns = db.transactions;

    let totalIbQty = 0;
    let totalObQty = 0;
    let totalDamageQty = 0;

    const palletTypeMap: Record<string, { code: string; name: string; ib: number; ob: number; soh: number }> = {};
    const facilityMap: Record<string, { code: string; name: string; ib: number; ob: number; soh: number }> = {};
    const sourceMap: Record<string, { label: string; count: number; qty: number }> = {};
    const monthlyMap: Record<string, { month: string; ib: number; ob: number }> = {};

    db.palletTypes.forEach((p: any) => {
      palletTypeMap[p.id] = { code: p.code, name: p.name, ib: 0, ob: 0, soh: 0 };
    });

    db.facilities.forEach((f: any) => {
      facilityMap[f.id] = { code: f.code, name: f.name, ib: 0, ob: 0, soh: 0 };
    });

    txns.forEach((t: any) => {
      const monthKey = t.timestamp.slice(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, ib: 0, ob: 0 };
      }

      if (!sourceMap[t.source]) {
        sourceMap[t.source] = { label: t.sourceLabel || t.source, count: 0, qty: 0 };
      }
      sourceMap[t.source].count += 1;
      sourceMap[t.source].qty += t.qty;

      if (t.type === 'INBOUND') {
        totalIbQty += t.qty;
        monthlyMap[monthKey].ib += t.qty;
        if (palletTypeMap[t.palletTypeId]) palletTypeMap[t.palletTypeId].ib += t.qty;
        if (facilityMap[t.facilityId]) facilityMap[t.facilityId].ib += t.qty;
      } else {
        totalObQty += t.qty;
        monthlyMap[monthKey].ob += t.qty;
        if (palletTypeMap[t.palletTypeId]) palletTypeMap[t.palletTypeId].ob += t.qty;
        if (facilityMap[t.facilityId]) facilityMap[t.facilityId].ob += t.qty;

        if (t.source === 'DMG_SIGNOFF' || t.source === 'DMG_SOLD') {
          totalDamageQty += t.qty;
        }
      }
    });

    Object.keys(palletTypeMap).forEach((id) => {
      palletTypeMap[id].soh = palletTypeMap[id].ib - palletTypeMap[id].ob;
    });
    Object.keys(facilityMap).forEach((id) => {
      facilityMap[id].soh = facilityMap[id].ib - facilityMap[id].ob;
    });

    const totalSOH = totalIbQty - totalObQty;

    res.json({
      kpis: {
        totalSOH,
        totalInbound: totalIbQty,
        totalOutbound: totalObQty,
        totalDamage: totalDamageQty,
        activeFacilitiesCount: db.facilities.filter((f: any) => f.status === 'ACTIVE').length,
        totalTransactionsCount: txns.length,
      },
      palletBreakdown: Object.values(palletTypeMap),
      facilityBreakdown: Object.values(facilityMap),
      sourceBreakdown: Object.values(sourceMap),
      monthlyTrends: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)),
    });
  });

  cached = app;
  return app;
}
