import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { genId } from '@/lib/server/gen-id';
import { toTransactionDto } from '@/lib/server/mappers/transaction.mapper';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function createTransaction(body: Record<string, unknown>): Promise<ServiceResponse> {
  const {
    type,
    source,
    sourceLabel,
    companyId,
    facilityId,
    docRefTypeId,
    docRefNumber,
    palletTypeId,
    qty,
    notes,
    user,
  } = body;

  if (!type || !source || !companyId || !facilityId || !docRefTypeId || !docRefNumber || !palletTypeId || !qty) {
    return { status: 400, body: { error: 'All fields are mandatory (source, company, facility, doc ref, pallet type, qty)' } };
  }

  const numQty = parseInt(String(qty), 10);
  if (isNaN(numQty) || numQty <= 0) {
    return { status: 400, body: { error: 'Quantity must be a positive integer' } };
  }

  const [company, facility, palletType, docRefType] = await Promise.all([
    prisma.company.findUnique({ where: { id: String(companyId) } }),
    prisma.facility.findUnique({ where: { id: String(facilityId) } }),
    prisma.palletType.findUnique({ where: { id: String(palletTypeId) } }),
    prisma.docRefType.findUnique({ where: { id: String(docRefTypeId) } }),
  ]);

  if (!company || !facility || !palletType || !docRefType) {
    return { status: 400, body: { error: 'Invalid reference selected for company, facility, pallet type, or doc ref' } };
  }

  const txnType = String(type).toUpperCase();
  if (txnType === 'OUTBOUND') {
    const agg = await prisma.palletTransaction.groupBy({
      by: ['type'],
      where: { facilityId: facility.id, palletTypeId: palletType.id },
      _sum: { qty: true },
    });
    let currentStock = 0;
    for (const row of agg) {
      if (row.type === 'INBOUND') currentStock += row._sum.qty ?? 0;
      if (row.type === 'OUTBOUND') currentStock -= row._sum.qty ?? 0;
    }
    if (numQty > currentStock) {
      console.warn(
        `Outbound quantity (${numQty}) exceeds current on-hand stock (${currentStock}) for facility ${facility.code}`
      );
    }
  }

  const userObj = user as { id?: string; username?: string; fullName?: string } | undefined;
  const created = await prisma.palletTransaction.create({
    data: {
      id: genId(txnType === 'INBOUND' ? 'TXN-IB' : 'TXN-OB'),
      type: txnType,
      source: String(source),
      sourceLabel: String(sourceLabel || source),
      companyId: company.id,
      companyCode: company.code,
      companyName: company.name,
      facilityId: facility.id,
      facilityCode: facility.code,
      facilityName: facility.name,
      docRefTypeId: docRefType.id,
      docRefTypeName: docRefType.name,
      docRefNumber: String(docRefNumber).trim(),
      palletTypeId: palletType.id,
      palletTypeCode: palletType.code,
      palletTypeName: palletType.name,
      qty: numQty,
      notes: String(notes || ''),
      createdByUserId: userObj?.id || 'USR-01',
      createdByUsername: userObj?.username || 'system.user',
      createdByName: userObj?.fullName || 'Warehouse Operator',
      timestamp: new Date(),
    },
  });

  const newTxn = toTransactionDto(created);
  return {
    status: 200,
    body: {
      success: true,
      transaction: newTxn,
      message: `${txnType === 'INBOUND' ? 'Received' : 'Shipped'} ${numQty} ${palletType.code} pallets successfully.`,
    },
  };
}

export async function bulkCreateTransactions(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { type, rows, user, defaultCompanyId, defaultFacilityId } = body;
  if (!type || !Array.isArray(rows) || rows.length === 0) {
    return { status: 400, body: { error: 'Type and non-empty rows array are required' } };
  }

  const [companies, facilities, palletTypes, docRefTypes] = await Promise.all([
    prisma.company.findMany(),
    prisma.facility.findMany({ include: { companies: true } }),
    prisma.palletType.findMany(),
    prisma.docRefType.findMany(),
  ]);

  const txnType = String(type).toUpperCase();
  const createdTxns: ReturnType<typeof toTransactionDto>[] = [];
  const errors: string[] = [];
  const toCreate: Prisma.PalletTransactionCreateManyInput[] = [];

  const userObj = user as { id?: string; username?: string; fullName?: string } | undefined;

  (rows as Record<string, unknown>[]).forEach((row, idx) => {
    try {
      const rowCompanyCode = row.Company || row.company || row.companyCode;
      const rowFacilityCode = row.Facility || row.facility || row.facilityCode;
      const rowSource = row.Source || row.source;
      const rowDocRefType = row.DocRefType || row.docRefType || row.docRefTypeName;
      const rowDocRef = row.DocRef || row.docRef || row.DocRefNumber || row.docRefNumber;
      const rowPalletType = row.PalletType || row.palletType || row.palletTypeCode;
      const rowQty = parseInt(String(row.Qty || row.qty || row.quantity), 10);
      const rowNotes = row.Notes || row.notes || 'Bulk CSV Upload';

      if (!rowDocRef || isNaN(rowQty) || rowQty <= 0) {
        errors.push(`Row ${idx + 1}: Missing DocRef or invalid Quantity`);
        return;
      }

      let company = companies.find(
        (c) => c.code === rowCompanyCode || c.name === rowCompanyCode
      );
      if (!company && defaultCompanyId) {
        company = companies.find((c) => c.id === defaultCompanyId);
      }
      if (!company) company = companies[0];

      let facility = facilities.find(
        (f) => f.code === rowFacilityCode || f.name === rowFacilityCode
      );
      if (!facility && defaultFacilityId) {
        facility = facilities.find((f) => f.id === defaultFacilityId);
      }
      if (!facility) {
        facility =
          facilities.find((f) => f.primaryCompanyId === company!.id) || facilities[0];
      }

      let pallet = palletTypes.find(
        (p) =>
          p.code.toLowerCase() === String(rowPalletType || '').toLowerCase() ||
          p.name.toLowerCase().includes(String(rowPalletType || '').toLowerCase())
      );
      if (!pallet) pallet = palletTypes[0];

      let docRefType = docRefTypes.find(
        (d) =>
          d.code.toLowerCase() === String(rowDocRefType || '').toLowerCase() ||
          d.name.toLowerCase().includes(String(rowDocRefType || '').toLowerCase())
      );
      if (!docRefType) docRefType = docRefTypes[0];

      const id = genId(txnType === 'INBOUND' ? 'TXN-IB' : 'TXN-OB');
      const timestamp = new Date();
      const record = {
        id,
        type: txnType,
        source: String(rowSource || (txnType === 'INBOUND' ? 'MKT_PURCHASE' : 'OUT_ORDER')),
        sourceLabel: String(rowSource || (txnType === 'INBOUND' ? 'Bulk Inbound' : 'Bulk Outbound')),
        companyId: company!.id,
        companyCode: company!.code,
        companyName: company!.name,
        facilityId: facility!.id,
        facilityCode: facility!.code,
        facilityName: facility!.name,
        docRefTypeId: docRefType!.id,
        docRefTypeName: docRefType!.name,
        docRefNumber: String(rowDocRef).trim(),
        palletTypeId: pallet!.id,
        palletTypeCode: pallet!.code,
        palletTypeName: pallet!.name,
        qty: rowQty,
        notes: String(rowNotes),
        createdByUserId: userObj?.id || 'USR-01',
        createdByUsername: userObj?.username || 'bulk_operator',
        createdByName: userObj?.fullName || 'Bulk Uploader',
        timestamp,
      };
      toCreate.push(record);
      createdTxns.push(toTransactionDto(record as never));
    } catch (e: unknown) {
      errors.push(`Row ${idx + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  });

  if (toCreate.length > 0) {
    await prisma.palletTransaction.createMany({ data: toCreate });
  }

  return {
    status: 200,
    body: {
      success: true,
      count: createdTxns.length,
      errors,
      message: `Successfully processed ${createdTxns.length} ${type} pallet records.`,
    },
  };
}
