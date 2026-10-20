/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserAccount,
  Company,
  Facility,
  PalletType,
  DocRefType,
  PalletTransaction,
  OracleWmsConfig,
  OracleWmsUser,
  StockOnHandRecord,
} from './types';

const jsonFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const raw = data.error ?? data.message;
    const detail =
      typeof raw === 'string'
        ? raw
        : raw != null
          ? JSON.stringify(raw)
          : `Request failed with status ${res.status}`;
    throw new Error(detail);
  }
  return data as T;
};

export const api = {
  /** Single round-trip for initial dashboard load (recommended on serverless). */
  getBootstrap: () =>
    jsonFetch<{
      companies: Company[];
      facilities: Facility[];
      palletTypes: PalletType[];
      docRefTypes: DocRefType[];
      transactions: PalletTransaction[];
      sohRecords: StockOnHandRecord[];
      oracleConfig: OracleWmsConfig;
      oracleUsers: OracleWmsUser[];
      users: UserAccount[];
    }>('/api/bootstrap'),

  // Oracle WMS Verification & Auth
  verifyOracleUser: (username: string) =>
    jsonFetch<{
      existsInOracle: boolean;
      oracleUser: OracleWmsUser;
      hasAppPassword: boolean;
      appUser: UserAccount | null;
      message: string;
    }>('/api/oracle-wms/verify-user', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  registerPassword: (username: string, password: string) =>
    jsonFetch<{ success: boolean; user: UserAccount; message: string }>('/api/auth/register-password', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    jsonFetch<{ success: boolean; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Oracle WMS Config & Diagnostics
  getOracleConfig: () => jsonFetch<OracleWmsConfig>('/api/oracle-config'),
  updateOracleConfig: (config: Partial<OracleWmsConfig>) =>
    jsonFetch<{ success: boolean; config: OracleWmsConfig }>('/api/oracle-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  testOracleConnection: (config?: Partial<OracleWmsConfig>) =>
    jsonFetch<{ success: boolean; latencyMs: number; message: string; status?: number }>(
      '/api/oracle-wms/test-connection',
      {
        method: 'POST',
        body: JSON.stringify(config || {}),
      }
    ),
  getOracleUsers: () => jsonFetch<OracleWmsUser[]>('/api/oracle-wms/users'),

  // Companies & Facilities (FACO)
  getCompaniesFacilities: () =>
    jsonFetch<{ companies: Company[]; facilities: Facility[] }>('/api/companies-facilities'),
  createCompany: (code: string, name: string) =>
    jsonFetch<{ success: boolean; company: Company }>('/api/companies', {
      method: 'POST',
      body: JSON.stringify({ code, name }),
    }),
  updateCompany: (id: string, data: Partial<Company>) =>
    jsonFetch<{ success: boolean; company: Company }>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createFacility: (data: { companyId?: string; companyIds?: string[]; code: string; name: string; city?: string; status?: 'ACTIVE' | 'INACTIVE' } | string, code?: string, name?: string, city?: string) => {
    const payload = typeof data === 'string'
      ? { companyId: data, companyIds: [data], code: code || '', name: name || '', city: city || '' }
      : data;
    return jsonFetch<{ success: boolean; facility: Facility }>('/api/facilities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateFacility: (id: string, data: Partial<Facility> & { companyIds?: string[] }) =>
    jsonFetch<{ success: boolean; facility: Facility }>(`/api/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  bulkUploadCompaniesFacilities: (rows: any[]) =>
    jsonFetch<{ success: boolean; message: string; companies: Company[]; facilities: Facility[] }>(
      '/api/companies-facilities/bulk-upload',
      {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }
    ),

  // Pallet Types
  getPalletTypes: () => jsonFetch<PalletType[]>('/api/pallet-types'),
  createPalletType: (data: Partial<PalletType>) =>
    jsonFetch<{ success: boolean; palletType: PalletType }>('/api/pallet-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePalletType: (id: string, data: Partial<PalletType>) =>
    jsonFetch<{ success: boolean; palletType: PalletType }>(`/api/pallet-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePalletType: (id: string) =>
    jsonFetch<{ success: boolean; message?: string }>(`/api/pallet-types/${id}`, {
      method: 'DELETE',
    }),

  // Document Reference Types
  getDocRefTypes: () => jsonFetch<DocRefType[]>('/api/doc-ref-types'),
  createDocRefType: (data: Partial<DocRefType>) =>
    jsonFetch<{ success: boolean; docRefType: DocRefType }>('/api/doc-ref-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDocRefType: (id: string, data: Partial<DocRefType>) =>
    jsonFetch<{ success: boolean; docRefType: DocRefType }>(`/api/doc-ref-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDocRefType: (id: string) =>
    jsonFetch<{ success: boolean; message?: string }>(`/api/doc-ref-types/${id}`, {
      method: 'DELETE',
    }),

  // User Management & RBAC
  getUsers: () => jsonFetch<UserAccount[]>('/api/users'),
  createUser: (data: any) =>
    jsonFetch<{ success: boolean; user: UserAccount }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    jsonFetch<{ success: boolean; user: UserAccount }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    jsonFetch<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Pallet Transactions
  getTransactions: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {});
    return jsonFetch<PalletTransaction[]>(`/api/transactions?${params.toString()}`);
  },
  createTransaction: (data: any) =>
    jsonFetch<{ success: boolean; transaction: PalletTransaction; message: string }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkUploadTransactions: (data: {
    type: 'INBOUND' | 'OUTBOUND';
    rows: any[];
    user: any;
    defaultCompanyId?: string;
    defaultFacilityId?: string;
  }) =>
    jsonFetch<{ success: boolean; count: number; errors: string[]; message: string }>(
      '/api/transactions/bulk',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Analytics
  getSOH: (companyId?: string, facilityId?: string) => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (facilityId) params.append('facilityId', facilityId);
    return jsonFetch<StockOnHandRecord[]>(`/api/analytics/soh?${params.toString()}`);
  },
  getAnalyticsOverview: () =>
    jsonFetch<{
      kpis: {
        totalSOH: number;
        totalInbound: number;
        totalOutbound: number;
        totalDamage: number;
        activeFacilitiesCount: number;
        totalTransactionsCount: number;
      };
      palletBreakdown: Array<{ code: string; name: string; ib: number; ob: number; soh: number }>;
      facilityBreakdown: Array<{ code: string; name: string; ib: number; ob: number; soh: number }>;
      sourceBreakdown: Array<{ label: string; count: number; qty: number }>;
      monthlyTrends: Array<{ month: string; ib: number; ob: number }>;
    }>('/api/analytics/overview'),

  // DB Backup & Reset
  resetDb: () => jsonFetch<{ success: boolean; message: string }>('/api/db/reset', { method: 'POST' }),
  exportDb: () => jsonFetch<any>('/api/db/export'),
};
