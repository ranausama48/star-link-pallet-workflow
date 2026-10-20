import type { PalletTransaction } from '@/types';

type PrismaTxn = {
  id: string;
  type: string;
  source: string;
  sourceLabel: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  facilityId: string;
  facilityCode: string;
  facilityName: string;
  docRefTypeId: string;
  docRefTypeName: string;
  docRefNumber: string;
  palletTypeId: string;
  palletTypeCode: string;
  palletTypeName: string;
  qty: number;
  notes: string;
  createdByUserId: string;
  createdByUsername: string;
  createdByName: string;
  timestamp: Date;
};

export function toTransactionDto(txn: PrismaTxn): PalletTransaction {
  return {
    ...txn,
    type: txn.type as PalletTransaction['type'],
    timestamp: txn.timestamp.toISOString(),
  };
}
