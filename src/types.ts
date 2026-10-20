/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Management' | 'Inquiry' | 'Operations';

export type ScreenId =
  | 'pallet_inbound'
  | 'pallet_outbound'
  | 'analytics_soh'
  | 'analytics_ib'
  | 'analytics_ob'
  | 'analytics_visuals'
  | 'admin_users'
  | 'admin_company'
  | 'admin_facility'
  | 'admin_faco'
  | 'admin_pallets'
  | 'admin_docref'
  | 'admin_oracle';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'all';

export interface ScreenPermission {
  screenId: ScreenId;
  level: PermissionLevel;
}

export interface CompanyFacilityRef {
  companyId: string;
  facilityId: string;
}

export interface UserAccount {
  id: string;
  username: string; // matches Oracle WMS user name
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // stored hashed or encoded
  hasAppPassword: boolean;
  assignedFaco: CompanyFacilityRef[]; // Assigned Company / Facility pairs
  screenPermissions: Record<ScreenId, PermissionLevel>;
  oracleVerified: boolean;
  oracleVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Facility {
  id: string;
  companyId: string; // primary company id
  companyIds?: string[]; // Defined companies associated with this facility (multiple selection)
  code: string;
  name: string;
  city: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PalletType {
  id: string;
  code: string; // e.g. WOODEN, EURO, PLASTIC, HEAVY_DUTY
  name: string; // e.g. Standard Wooden (120x100)
  material: 'Wood' | 'Plastic' | 'Metal' | 'Composite';
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  tareWeightKg: number;
  maxLoadKg: number;
  color?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DocRefType {
  id: string;
  code: string; // SHIPMENT, ORDER, PO, TO, ASN
  name: string; // e.g. Shipment Number, Customer PO#
  description?: string;
  patternMask?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type InboundSourceType =
  | 'MKT_PURCHASE' // Empty Pallet Market Purchase
  | 'RCV_SHIPMENT' // Pallet Received in Shipment
  | 'VND_RETURN'   // Vendor Return
  | 'IOT_IN';      // IOT (Inter-Org / Inter-Facility Inbound)

export type OutboundSourceType =
  | 'OUT_ORDER'    // Out on order
  | 'IOT_XFER'     // IOT - Facility to Facility Transfer
  | 'DMG_SIGNOFF'  // Damage Pallet Signoff
  | 'DMG_SOLD';    // Damage Pallet Sold

export interface PalletTransaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  source: string; // e.g., MKT_PURCHASE or OUT_ORDER
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
  notes?: string;
  createdByUserId: string;
  createdByUsername: string;
  createdByName: string;
  timestamp: string; // ISO String
}

export interface OracleWmsConfig {
  apiUrl: string; // e.g. https://oraclewms-cloud.company.com/wms/lgf/api/v2
  authType: 'BEARER' | 'BASIC' | 'HEADER_KEY' | 'SIMULATED';
  apiKeyOrToken: string;
  username?: string;
  password?: string;
  enabled: boolean;
  statusText?: string;
  lastTestedAt?: string;
  lastSyncStatus?: 'CONNECTED' | 'FAILED' | 'UNCONFIGURED';
}

export interface OracleWmsUser {
  username: string;
  fullName: string;
  email: string;
  department: string;
  oracleRole: string;
  status: 'ACTIVE' | 'LOCKED';
}

export interface StockOnHandRecord {
  companyId: string;
  companyName: string;
  facilityId: string;
  facilityName: string;
  palletTypeId: string;
  palletTypeCode: string;
  palletTypeName: string;
  totalInbound: number;
  totalOutbound: number;
  currentSOH: number;
  lastMovementTime?: string;
}
