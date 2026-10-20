/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'warehouse_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Database
const getInitialDatabase = () => ({
  oracleConfig: {
    apiUrl: 'https://wms-saas.oraclecloud.com/starlinks_wms/lgf/api/v2/entity/user',
    authType: 'SIMULATED',
    apiKeyOrToken: 'Bearer stl_wms_prod_live_key_99214',
    username: 'wms_integration_svc',
    password: '••••••••••••',
    enabled: true,
    statusText: 'Connected to Oracle WMS Directory (Live Ready / Simulated Hybrid)',
    lastTestedAt: new Date().toISOString(),
    lastSyncStatus: 'CONNECTED',
  },
  oracleUsers: [
    {
      username: 'obaidullah.r',
      fullName: 'Obaidullah Rana',
      email: 'obaidullahrana2@gmail.com',
      department: 'Logistics Architecture',
      oracleRole: 'WMS_SUPER_USER',
      status: 'ACTIVE',
    },
    {
      username: 'admin.starlinks',
      fullName: 'Starlinks System Admin',
      email: 'admin@starlinks-logistics.com',
      department: 'Warehouse Administration',
      oracleRole: 'WMS_ADMIN',
      status: 'ACTIVE',
    },
    {
      username: 'faisal.m',
      fullName: 'Faisal Al-Mansoor',
      email: 'faisal.m@starlinks-logistics.com',
      department: 'Supply Chain Management',
      oracleRole: 'WMS_MANAGER',
      status: 'ACTIVE',
    },
    {
      username: 'khalid.ops',
      fullName: 'Khalid Al-Ghamdi',
      email: 'khalid.ops@starlinks-logistics.com',
      department: 'Riyadh Inbound/Outbound Ops',
      oracleRole: 'WMS_OPERATOR',
      status: 'ACTIVE',
    },
    {
      username: 'sara.a',
      fullName: 'Sara Al-Otaibi',
      email: 'sara.a@starlinks-logistics.com',
      department: 'Jeddah Cross-Dock Operations',
      oracleRole: 'WMS_OPERATOR',
      status: 'ACTIVE',
    },
    {
      username: 'inquiry.auditor',
      fullName: 'Tariq Al-Harbi',
      email: 'tariq.inquiry@starlinks-logistics.com',
      department: 'Inventory Quality & Audit',
      oracleRole: 'WMS_VIEWER',
      status: 'ACTIVE',
    },
    {
      username: 'new.operator',
      fullName: 'Nawaf Al-Zahrani',
      email: 'nawaf.z@starlinks-logistics.com',
      department: 'Dammam Warehouse Inbound',
      oracleRole: 'WMS_OPERATOR',
      status: 'ACTIVE',
    },
  ],
  companies: [
    { id: 'COMP-01', code: 'STL_GLOBAL', name: 'Starlinks Global Logistics', status: 'ACTIVE' },
    { id: 'COMP-02', code: 'STL_KSA', name: 'Starlinks KSA Express & Freight', status: 'ACTIVE' },
    { id: 'COMP-03', code: 'STL_RETAIL', name: 'Starlinks E-Commerce & Retail Hub', status: 'ACTIVE' },
  ],
  facilities: [
    { id: 'FAC-01', companyId: 'COMP-01', code: 'RUH-FC01', name: 'Riyadh Central Mega-Hub (RUH-FC01)', city: 'Riyadh', status: 'ACTIVE' },
    { id: 'FAC-02', companyId: 'COMP-01', code: 'JED-DC02', name: 'Jeddah Port Cross-Dock (JED-DC02)', city: 'Jeddah', status: 'ACTIVE' },
    { id: 'FAC-03', companyId: 'COMP-02', code: 'DMM-WH03', name: 'Dammam Logistics Park (DMM-WH03)', city: 'Dammam', status: 'ACTIVE' },
    { id: 'FAC-04', companyId: 'COMP-02', code: 'RUH-WH04', name: 'Sulay Air Cargo Distribution (RUH-WH04)', city: 'Riyadh', status: 'ACTIVE' },
    { id: 'FAC-05', companyId: 'COMP-03', code: 'DXB-FC05', name: 'Dubai South Fulfillment Hub (DXB-FC05)', city: 'Dubai', status: 'ACTIVE' },
  ],
  palletTypes: [
    {
      id: 'PLT-WOOD',
      code: 'WOODEN',
      name: 'Standard Industrial Wooden Pallet',
      material: 'Wood',
      lengthCm: 120,
      widthCm: 100,
      heightCm: 15,
      tareWeightKg: 22,
      maxLoadKg: 1500,
      color: '#D97706',
      status: 'ACTIVE',
    },
    {
      id: 'PLT-EURO',
      code: 'EURO',
      name: 'EUR / EPAL Standard Pallet',
      material: 'Wood',
      lengthCm: 120,
      widthCm: 80,
      heightCm: 14.4,
      tareWeightKg: 25,
      maxLoadKg: 1500,
      color: '#059669',
      status: 'ACTIVE',
    },
    {
      id: 'PLT-PLAST',
      code: 'PLASTIC',
      name: 'Heavy-Duty Hygienic Plastic Pallet',
      material: 'Plastic',
      lengthCm: 120,
      widthCm: 100,
      heightCm: 16,
      tareWeightKg: 18,
      maxLoadKg: 1250,
      color: '#0284C7',
      status: 'ACTIVE',
    },
    {
      id: 'PLT-METAL',
      code: 'METAL',
      name: 'Galvanized Steel Heavy Pallet',
      material: 'Metal',
      lengthCm: 120,
      widthCm: 100,
      heightCm: 15,
      tareWeightKg: 38,
      maxLoadKg: 2800,
      color: '#64748B',
      status: 'ACTIVE',
    },
  ],
  docRefTypes: [
    { id: 'REF-SHIP', code: 'SHIPMENT_NO', name: 'Shipment Number', description: 'Inbound / Outbound manifest shipment ref', status: 'ACTIVE' },
    { id: 'REF-ORDER', code: 'ORDER_NO', name: 'Customer / Delivery Order #', description: 'Outbound sales/delivery order number', status: 'ACTIVE' },
    { id: 'REF-PO', code: 'PO_NO', name: 'Customer PO#', description: 'Client Purchase Order identifier', status: 'ACTIVE' },
    { id: 'REF-TO', code: 'TRANSFER_NO', name: 'Transfer Order (IOT) #', description: 'Inter-facility transfer document', status: 'ACTIVE' },
    { id: 'REF-ASN', code: 'ASN_NO', name: 'Advance Shipping Notice (ASN)', description: 'Pre-advised vendor shipping notification', status: 'ACTIVE' },
  ],
  users: [
    {
      id: 'USR-01',
      username: 'obaidullah.r',
      fullName: 'Obaidullah Rana',
      email: 'obaidullahrana2@gmail.com',
      role: 'Admin',
      passwordHash: 'password123',
      hasAppPassword: true,
      assignedFaco: [
        { companyId: 'COMP-01', facilityId: 'FAC-01' },
        { companyId: 'COMP-01', facilityId: 'FAC-02' },
        { companyId: 'COMP-02', facilityId: 'FAC-03' },
        { companyId: 'COMP-02', facilityId: 'FAC-04' },
        { companyId: 'COMP-03', facilityId: 'FAC-05' },
      ],
      screenPermissions: {
        pallet_inbound: 'all',
        pallet_outbound: 'all',
        analytics_soh: 'all',
        analytics_ib: 'all',
        analytics_ob: 'all',
        analytics_visuals: 'all',
        admin_users: 'all',
        admin_faco: 'all',
        admin_pallets: 'all',
        admin_docref: 'all',
        admin_oracle: 'all',
      },
      oracleVerified: true,
      oracleVerifiedAt: '2026-09-01T08:00:00.000Z',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-10-15T02:00:00.000Z',
    },
    {
      id: 'USR-02',
      username: 'admin.starlinks',
      fullName: 'Starlinks Admin',
      email: 'admin@starlinks-logistics.com',
      role: 'Admin',
      passwordHash: 'password123',
      hasAppPassword: true,
      assignedFaco: [
        { companyId: 'COMP-01', facilityId: 'FAC-01' },
        { companyId: 'COMP-01', facilityId: 'FAC-02' },
        { companyId: 'COMP-02', facilityId: 'FAC-03' },
        { companyId: 'COMP-02', facilityId: 'FAC-04' },
        { companyId: 'COMP-03', facilityId: 'FAC-05' },
      ],
      screenPermissions: {
        pallet_inbound: 'all',
        pallet_outbound: 'all',
        analytics_soh: 'all',
        analytics_ib: 'all',
        analytics_ob: 'all',
        analytics_visuals: 'all',
        admin_users: 'all',
        admin_faco: 'all',
        admin_pallets: 'all',
        admin_docref: 'all',
        admin_oracle: 'all',
      },
      oracleVerified: true,
      oracleVerifiedAt: '2026-09-01T08:00:00.000Z',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-10-15T02:00:00.000Z',
    },
    {
      id: 'USR-03',
      username: 'khalid.ops',
      fullName: 'Khalid Al-Ghamdi',
      email: 'khalid.ops@starlinks-logistics.com',
      role: 'Operations',
      passwordHash: 'password123',
      hasAppPassword: true,
      assignedFaco: [
        { companyId: 'COMP-01', facilityId: 'FAC-01' },
        { companyId: 'COMP-01', facilityId: 'FAC-02' },
      ],
      screenPermissions: {
        pallet_inbound: 'edit',
        pallet_outbound: 'edit',
        analytics_soh: 'view',
        analytics_ib: 'view',
        analytics_ob: 'view',
        analytics_visuals: 'view',
        admin_users: 'none',
        admin_faco: 'none',
        admin_pallets: 'none',
        admin_docref: 'none',
        admin_oracle: 'none',
      },
      oracleVerified: true,
      oracleVerifiedAt: '2026-09-10T09:30:00.000Z',
      createdAt: '2026-09-10T09:30:00.000Z',
      updatedAt: '2026-10-14T11:00:00.000Z',
    },
    {
      id: 'USR-04',
      username: 'faisal.m',
      fullName: 'Faisal Al-Mansoor',
      email: 'faisal.m@starlinks-logistics.com',
      role: 'Management',
      passwordHash: 'password123',
      hasAppPassword: true,
      assignedFaco: [
        { companyId: 'COMP-01', facilityId: 'FAC-01' },
        { companyId: 'COMP-01', facilityId: 'FAC-02' },
        { companyId: 'COMP-02', facilityId: 'FAC-03' },
      ],
      screenPermissions: {
        pallet_inbound: 'view',
        pallet_outbound: 'view',
        analytics_soh: 'view',
        analytics_ib: 'view',
        analytics_ob: 'view',
        analytics_visuals: 'view',
        admin_users: 'none',
        admin_faco: 'view',
        admin_pallets: 'view',
        admin_docref: 'view',
        admin_oracle: 'none',
      },
      oracleVerified: true,
      oracleVerifiedAt: '2026-09-05T12:00:00.000Z',
      createdAt: '2026-09-05T12:00:00.000Z',
      updatedAt: '2026-10-12T14:20:00.000Z',
    },
    {
      id: 'USR-05',
      username: 'inquiry.auditor',
      fullName: 'Tariq Al-Harbi',
      email: 'tariq.inquiry@starlinks-logistics.com',
      role: 'Inquiry',
      passwordHash: 'password123',
      hasAppPassword: true,
      assignedFaco: [
        { companyId: 'COMP-01', facilityId: 'FAC-01' },
        { companyId: 'COMP-02', facilityId: 'FAC-03' },
      ],
      screenPermissions: {
        pallet_inbound: 'view',
        pallet_outbound: 'view',
        analytics_soh: 'view',
        analytics_ib: 'view',
        analytics_ob: 'view',
        analytics_visuals: 'view',
        admin_users: 'none',
        admin_faco: 'none',
        admin_pallets: 'none',
        admin_docref: 'none',
        admin_oracle: 'none',
      },
      oracleVerified: true,
      oracleVerifiedAt: '2026-09-15T15:00:00.000Z',
      createdAt: '2026-09-15T15:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    },
  ],
  transactions: [
    // Historical Inbounds
    {
      id: 'TXN-IB-101',
      type: 'INBOUND',
      source: 'MKT_PURCHASE',
      sourceLabel: 'Empty Pallet Market Purchase',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-PO',
      docRefTypeName: 'Customer PO#',
      docRefNumber: 'PO-2026-9041',
      palletTypeId: 'PLT-WOOD',
      palletTypeCode: 'WOODEN',
      palletTypeName: 'Standard Industrial Wooden Pallet',
      qty: 450,
      notes: 'Initial lot replenishment from Al-Yamama Pallets',
      createdByUserId: 'USR-01',
      createdByUsername: 'obaidullah.r',
      createdByName: 'Obaidullah Rana',
      timestamp: '2026-09-02T09:15:00.000Z',
    },
    {
      id: 'TXN-IB-102',
      type: 'INBOUND',
      source: 'RCV_SHIPMENT',
      sourceLabel: 'Pallet Received in Shipment',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-SHIP',
      docRefTypeName: 'Shipment Number',
      docRefNumber: 'SHP-992182',
      palletTypeId: 'PLT-EURO',
      palletTypeCode: 'EURO',
      palletTypeName: 'EUR / EPAL Standard Pallet',
      qty: 280,
      notes: 'Received with electronics container from King Abdulaziz Port',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-09-08T11:45:00.000Z',
    },
    {
      id: 'TXN-IB-103',
      type: 'INBOUND',
      source: 'RCV_SHIPMENT',
      sourceLabel: 'Pallet Received in Shipment',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-02',
      facilityCode: 'JED-DC02',
      facilityName: 'Jeddah Port Cross-Dock (JED-DC02)',
      docRefTypeId: 'REF-SHIP',
      docRefTypeName: 'Shipment Number',
      docRefNumber: 'SHP-JED-4402',
      palletTypeId: 'PLT-PLAST',
      palletTypeCode: 'PLASTIC',
      palletTypeName: 'Heavy-Duty Hygienic Plastic Pallet',
      qty: 320,
      notes: 'Pharma temperature controlled consignment receipt',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-09-15T14:30:00.000Z',
    },
    {
      id: 'TXN-IB-104',
      type: 'INBOUND',
      source: 'IOT_IN',
      sourceLabel: 'IOT - Inter-Facility Inbound',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-TO',
      docRefTypeName: 'Transfer Order (IOT) #',
      docRefNumber: 'TO-JED-RUH-882',
      palletTypeId: 'PLT-WOOD',
      palletTypeCode: 'WOODEN',
      palletTypeName: 'Standard Industrial Wooden Pallet',
      qty: 120,
      notes: 'Transferred from Jeddah Port depot buffer',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-09-22T16:00:00.000Z',
    },
    {
      id: 'TXN-IB-105',
      type: 'INBOUND',
      source: 'VND_RETURN',
      sourceLabel: 'Vendor Return',
      companyId: 'COMP-02',
      companyCode: 'STL_KSA',
      companyName: 'Starlinks KSA Express & Freight',
      facilityId: 'FAC-03',
      facilityCode: 'DMM-WH03',
      facilityName: 'Dammam Logistics Park (DMM-WH03)',
      docRefTypeId: 'REF-ASN',
      docRefTypeName: 'Advance Shipping Notice (ASN)',
      docRefNumber: 'ASN-DMM-1190',
      palletTypeId: 'PLT-EURO',
      palletTypeCode: 'EURO',
      palletTypeName: 'EUR / EPAL Standard Pallet',
      qty: 160,
      notes: 'Reverse logistics returned empty pallets from retail partners',
      createdByUserId: 'USR-01',
      createdByUsername: 'obaidullah.r',
      createdByName: 'Obaidullah Rana',
      timestamp: '2026-10-02T10:10:00.000Z',
    },
    {
      id: 'TXN-IB-106',
      type: 'INBOUND',
      source: 'MKT_PURCHASE',
      sourceLabel: 'Empty Pallet Market Purchase',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-PO',
      docRefTypeName: 'Customer PO#',
      docRefNumber: 'PO-2026-9810',
      palletTypeId: 'PLT-PLAST',
      palletTypeCode: 'PLASTIC',
      palletTypeName: 'Heavy-Duty Hygienic Plastic Pallet',
      qty: 200,
      notes: 'New plastic pallet acquisition for cleanroom zone',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-10-10T13:20:00.000Z',
    },

    // Historical Outbounds
    {
      id: 'TXN-OB-201',
      type: 'OUTBOUND',
      source: 'OUT_ORDER',
      sourceLabel: 'Out on Order',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-ORDER',
      docRefTypeName: 'Customer / Delivery Order #',
      docRefNumber: 'SO-RUH-88201',
      palletTypeId: 'PLT-WOOD',
      palletTypeCode: 'WOODEN',
      palletTypeName: 'Standard Industrial Wooden Pallet',
      qty: 180,
      notes: 'Dispatched on FMCG bulk order to Panda Hypermarkets',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-09-12T15:40:00.000Z',
    },
    {
      id: 'TXN-OB-202',
      type: 'OUTBOUND',
      source: 'IOT_XFER',
      sourceLabel: 'IOT - Facility to Facility Transfer',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-TO',
      docRefTypeName: 'Transfer Order (IOT) #',
      docRefNumber: 'TO-RUH-JED-710',
      palletTypeId: 'PLT-EURO',
      palletTypeCode: 'EURO',
      palletTypeName: 'EUR / EPAL Standard Pallet',
      qty: 90,
      notes: 'Inter-facility transfer to Jeddah Port Cross-dock',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-09-20T17:15:00.000Z',
    },
    {
      id: 'TXN-OB-203',
      type: 'OUTBOUND',
      source: 'DMG_SIGNOFF',
      sourceLabel: 'Damage Pallet Signoff',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-SHIP',
      docRefTypeName: 'Shipment Number',
      docRefNumber: 'DMG-RPT-041',
      palletTypeId: 'PLT-WOOD',
      palletTypeCode: 'WOODEN',
      palletTypeName: 'Standard Industrial Wooden Pallet',
      qty: 15,
      notes: 'Forklift impact damage - decommissioned and sent to recycling',
      createdByUserId: 'USR-01',
      createdByUsername: 'obaidullah.r',
      createdByName: 'Obaidullah Rana',
      timestamp: '2026-09-28T09:00:00.000Z',
    },
    {
      id: 'TXN-OB-204',
      type: 'OUTBOUND',
      source: 'OUT_ORDER',
      sourceLabel: 'Out on Order',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-02',
      facilityCode: 'JED-DC02',
      facilityName: 'Jeddah Port Cross-Dock (JED-DC02)',
      docRefTypeId: 'REF-ORDER',
      docRefTypeName: 'Customer / Delivery Order #',
      docRefNumber: 'SO-JED-4109',
      palletTypeId: 'PLT-PLAST',
      palletTypeCode: 'PLASTIC',
      palletTypeName: 'Heavy-Duty Hygienic Plastic Pallet',
      qty: 110,
      notes: 'Customer dispatch to King Fahad Hospital supply chain',
      createdByUserId: 'USR-03',
      createdByUsername: 'khalid.ops',
      createdByName: 'Khalid Al-Ghamdi',
      timestamp: '2026-10-04T12:00:00.000Z',
    },
    {
      id: 'TXN-OB-205',
      type: 'OUTBOUND',
      source: 'DMG_SOLD',
      sourceLabel: 'Damage Pallet Sold',
      companyId: 'COMP-01',
      companyCode: 'STL_GLOBAL',
      companyName: 'Starlinks Global Logistics',
      facilityId: 'FAC-01',
      facilityCode: 'RUH-FC01',
      facilityName: 'Riyadh Central Mega-Hub (RUH-FC01)',
      docRefTypeId: 'REF-PO',
      docRefTypeName: 'Customer PO#',
      docRefNumber: 'SALVAGE-2026-12',
      palletTypeId: 'PLT-WOOD',
      palletTypeCode: 'WOODEN',
      palletTypeName: 'Standard Industrial Wooden Pallet',
      qty: 35,
      notes: 'Sold to local certified pallet refurbisher scrap lot',
      createdByUserId: 'USR-01',
      createdByUsername: 'obaidullah.r',
      createdByName: 'Obaidullah Rana',
      timestamp: '2026-10-12T16:30:00.000Z',
    },
  ],
});

// Database loader and saver
const loadDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading database file, reinitializing fallback:', err);
    return getInitialDatabase();
  }
};

const saveDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving database:', err);
    return false;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Helper for ID generation
  const genId = (prefix: string) => `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

  // ==========================================
  // API: Health & DB Backup
  // ==========================================
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Starlinks Pallet Flow' });
  });

  app.get('/api/db/export', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db);
  });

  app.post('/api/db/reset', (_req: Request, res: Response) => {
    const initial = getInitialDatabase();
    saveDb(initial);
    res.json({ success: true, message: 'Database reset to verified warehouse baseline', db: initial });
  });

  // ==========================================
  // API: Oracle WMS Configuration & Verification
  // ==========================================
  app.get('/api/oracle-config', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.oracleConfig || {});
  });

  app.put('/api/oracle-config', (req: Request, res: Response) => {
    const db = loadDb();
    db.oracleConfig = {
      ...db.oracleConfig,
      ...req.body,
      lastTestedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json({ success: true, config: db.oracleConfig });
  });

  // Test Oracle WMS API Connection
  app.post('/api/oracle-wms/test-connection', async (req: Request, res: Response) => {
    const db = loadDb();
    const config = { ...db.oracleConfig, ...(req.body || {}) };
    const startTime = Date.now();

    // If external URL is provided and not simulated
    if (config.apiUrl && config.apiUrl.startsWith('http') && config.authType !== 'SIMULATED') {
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
        if (config.authType === 'BEARER' && config.apiKeyOrToken) {
          headers['Authorization'] = config.apiKeyOrToken.startsWith('Bearer ') ? config.apiKeyOrToken : `Bearer ${config.apiKeyOrToken}`;
        } else if (config.authType === 'BASIC' && config.username) {
          const authString = Buffer.from(`${config.username}:${config.password || ''}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(config.apiUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;
        db.oracleConfig.lastSyncStatus = response.ok ? 'CONNECTED' : 'FAILED';
        db.oracleConfig.lastTestedAt = new Date().toISOString();
        db.oracleConfig.statusText = `Oracle WMS HTTP ${response.status} (${latency}ms)`;
        saveDb(db);

        return res.json({
          success: response.ok,
          status: response.status,
          latencyMs: latency,
          message: `Received status ${response.status} from Oracle WMS endpoint in ${latency}ms`,
        });
      } catch (err: any) {
        const latency = Date.now() - startTime;
        return res.json({
          success: false,
          latencyMs: latency,
          message: `Direct HTTP connection note: ${err.message}. Simulated enterprise fallback is active.`,
        });
      }
    }

    // Default simulated / enterprise sandbox mode
    const latency = Math.floor(Math.random() * 40 + 60);
    db.oracleConfig.lastSyncStatus = 'CONNECTED';
    db.oracleConfig.lastTestedAt = new Date().toISOString();
    db.oracleConfig.statusText = `Simulated Oracle WMS Endpoint Active (${db.oracleUsers.length} verified users)`;
    saveDb(db);

    res.json({
      success: true,
      status: 200,
      latencyMs: latency,
      message: `Successfully connected to Oracle WMS directory. Verified ${db.oracleUsers.length} active warehouse user records.`,
      usersCount: db.oracleUsers.length,
    });
  });

  // Verify User against Oracle WMS
  app.post('/api/oracle-wms/verify-user', async (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = loadDb();

    // Check directory of Oracle WMS users
    const matchedUser = db.oracleUsers.find(
      (u: any) => u.username.toLowerCase() === cleanUsername
    );

    if (matchedUser) {
      // Also check if user already has an account registered in this app
      const existingAppUser = db.users.find(
        (u: any) => u.username.toLowerCase() === cleanUsername
      );

      return res.json({
        existsInOracle: true,
        oracleUser: matchedUser,
        hasAppPassword: Boolean(existingAppUser && existingAppUser.hasAppPassword),
        appUser: existingAppUser || null,
        message: `User '${matchedUser.username}' (${matchedUser.fullName}) successfully verified against Oracle WMS directory.`,
      });
    }

    // User not found in Oracle WMS
    return res.status(404).json({
      existsInOracle: false,
      message: `User '${cleanUsername}' was not found in Oracle WMS directory. Please contact your WMS Administrator.`,
    });
  });

  // Get Oracle Users list for Admin view
  app.get('/api/oracle-wms/users', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.oracleUsers || []);
  });

  // ==========================================
  // API: Authentication & App Password Setup
  // ==========================================
  app.post('/api/auth/register-password', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = loadDb();

    // Verify user exists in Oracle WMS
    const oracleUser = db.oracleUsers.find((u: any) => u.username.toLowerCase() === cleanUsername);
    if (!oracleUser) {
      return res.status(400).json({ error: 'User is not verified with Oracle WMS' });
    }

    // Check if app user already exists
    let appUser = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);

    if (appUser) {
      appUser.passwordHash = password;
      appUser.hasAppPassword = true;
      appUser.oracleVerified = true;
      appUser.oracleVerifiedAt = new Date().toISOString();
      appUser.updatedAt = new Date().toISOString();
    } else {
      // Create new app user account
      appUser = {
        id: genId('USR'),
        username: oracleUser.username,
        fullName: oracleUser.fullName,
        email: oracleUser.email,
        role: 'Operations', // Default role pending Admin assignment
        passwordHash: password,
        hasAppPassword: true,
        assignedFaco: [
          // Default first facility
          { companyId: 'COMP-01', facilityId: 'FAC-01' }
        ],
        screenPermissions: {
          pallet_inbound: 'edit',
          pallet_outbound: 'edit',
          analytics_soh: 'view',
          analytics_ib: 'view',
          analytics_ob: 'view',
          analytics_visuals: 'view',
          admin_users: 'none',
          admin_faco: 'none',
          admin_pallets: 'none',
          admin_docref: 'none',
          admin_oracle: 'none',
        },
        oracleVerified: true,
        oracleVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(appUser);
    }

    saveDb(db);
    const { passwordHash, ...safeUser } = appUser;
    res.json({ success: true, message: 'Password established successfully. You can now login.', user: safeUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = loadDb();

    const user = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      // Check if user is in Oracle WMS but hasn't set an app password yet
      const oracleUser = db.oracleUsers.find((u: any) => u.username.toLowerCase() === cleanUsername);
      if (oracleUser) {
        return res.status(403).json({
          error: 'User exists in Oracle WMS but needs to create an app password first.',
          requiresPasswordSetup: true,
        });
      }
      return res.status(401).json({ error: 'Invalid username or user not found in warehouse registry' });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Incorrect password entered' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // API: User Management (Admin Only)
  // ==========================================
  app.get('/api/users', (_req: Request, res: Response) => {
    const db = loadDb();
    const safeUsers = db.users.map(({ passwordHash, ...u }: any) => u);
    res.json(safeUsers);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const db = loadDb();
    const { username, fullName, email, role, assignedFaco, screenPermissions, password } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (db.users.some((u: any) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'A user with this username already exists' });
    }

    // Default permissions based on role if not provided
    const defaultPermissions: Record<string, string> = {
      pallet_inbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
      pallet_outbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
      analytics_soh: 'view',
      analytics_ib: 'view',
      analytics_ob: 'view',
      analytics_visuals: 'view',
      admin_users: role === 'Admin' ? 'all' : 'none',
      admin_faco: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_pallets: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_docref: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_oracle: role === 'Admin' ? 'all' : 'none',
    };

    const newUser = {
      id: genId('USR'),
      username: cleanUsername,
      fullName: fullName || cleanUsername,
      email: email || `${cleanUsername}@starlinks-logistics.com`,
      role,
      passwordHash: password || 'password123',
      hasAppPassword: Boolean(password),
      assignedFaco: assignedFaco || [{ companyId: 'COMP-01', facilityId: 'FAC-01' }],
      screenPermissions: screenPermissions || defaultPermissions,
      oracleVerified: true,
      oracleVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const { passwordHash, ...safe } = newUser;
    res.json({ success: true, user: safe });
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const index = db.users.findIndex((u: any) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = db.users[index];
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    // If password provided, update hash
    if (req.body.password) {
      updated.passwordHash = req.body.password;
      updated.hasAppPassword = true;
    }

    db.users[index] = updated;
    saveDb(db);

    const { passwordHash, ...safe } = updated;
    res.json({ success: true, user: safe });
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const current = db.users.find((u: any) => u.id === id);

    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (current.username === 'obaidullah.r' || current.username === 'admin.starlinks') {
      return res.status(400).json({ error: 'Cannot delete primary root administrator' });
    }

    db.users = db.users.filter((u: any) => u.id !== id);
    saveDb(db);
    res.json({ success: true, message: `User ${current.username} deleted` });
  });

  // ==========================================
  // API: Companies & Facilities (FACO)
  // ==========================================
  app.get('/api/companies-facilities', (_req: Request, res: Response) => {
    const db = loadDb();
    const companies = (db.companies || []).map((c: any) => ({
      ...c,
      status: c.status || 'ACTIVE',
    }));
    const facilities = (db.facilities || []).map((f: any) => ({
      ...f,
      companyIds: f.companyIds && Array.isArray(f.companyIds) && f.companyIds.length > 0
        ? f.companyIds
        : (f.companyId ? [f.companyId] : []),
      status: f.status || 'ACTIVE',
    }));
    res.json({
      companies,
      facilities,
    });
  });

  app.post('/api/companies', (req: Request, res: Response) => {
    const db = loadDb();
    const { code, name, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    const newComp = {
      id: genId('COMP'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    db.companies = db.companies || [];
    db.companies.push(newComp);
    saveDb(db);
    res.json({ success: true, company: newComp });
  });

  app.put('/api/companies/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const { id } = req.params;
    const { code, name, status } = req.body;
    const comp = (db.companies || []).find((c: any) => c.id === id);
    if (!comp) {
      return res.status(404).json({ error: 'Company not found' });
    }
    if (code !== undefined) comp.code = code.trim().toUpperCase();
    if (name !== undefined) comp.name = name.trim();
    if (status !== undefined) comp.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    saveDb(db);
    res.json({ success: true, company: comp });
  });

  app.post('/api/facilities', (req: Request, res: Response) => {
    const db = loadDb();
    const { companyId, companyIds, code, name, city, status } = req.body;
    const assignedCompanyIds: string[] = Array.isArray(companyIds) && companyIds.length > 0
      ? companyIds
      : (companyId ? [companyId] : []);
    if (assignedCompanyIds.length === 0 || !code || !name) {
      return res.status(400).json({ error: 'At least one Company, facility code, and name are required' });
    }
    const newFac = {
      id: genId('FAC'),
      companyId: assignedCompanyIds[0],
      companyIds: assignedCompanyIds,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      city: city ? city.trim() : 'Warehouse Center',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    db.facilities = db.facilities || [];
    db.facilities.push(newFac);
    saveDb(db);
    res.json({ success: true, facility: newFac });
  });

  app.put('/api/facilities/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const { id } = req.params;
    const { code, name, city, companyId, companyIds, status } = req.body;
    const fac = (db.facilities || []).find((f: any) => f.id === id);
    if (!fac) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    if (code !== undefined) fac.code = code.trim().toUpperCase();
    if (name !== undefined) fac.name = name.trim();
    if (city !== undefined) fac.city = city.trim();
    if (companyIds !== undefined && Array.isArray(companyIds)) {
      fac.companyIds = companyIds;
      if (companyIds.length > 0) {
        fac.companyId = companyIds[0];
      }
    } else if (companyId !== undefined) {
      fac.companyId = companyId;
      if (!fac.companyIds || fac.companyIds.length === 0) {
        fac.companyIds = [companyId];
      }
    }
    if (status !== undefined) fac.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    saveDb(db);
    res.json({ success: true, facility: fac });
  });

  // Bulk Upload Companies & Facilities via CSV rows
  app.post('/api/companies-facilities/bulk-upload', (req: Request, res: Response) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for bulk upload' });
    }

    const db = loadDb();
    let companiesAdded = 0;
    let facilitiesAdded = 0;

    for (const row of rows) {
      const compCode = (row.companyCode || row.CompanyCode || row.company || '').trim().toUpperCase();
      const compName = (row.companyName || row.CompanyName || compCode).trim();
      const facCode = (row.facilityCode || row.FacilityCode || row.facility || '').trim().toUpperCase();
      const facName = (row.facilityName || row.FacilityName || facCode).trim();
      const city = (row.city || row.City || 'Central Hub').trim();

      if (!compCode || !facCode) continue;

      let company = db.companies.find((c: any) => c.code === compCode);
      if (!company) {
        company = {
          id: genId('COMP'),
          code: compCode,
          name: compName || compCode,
          status: 'ACTIVE',
        };
        db.companies.push(company);
        companiesAdded++;
      }

      let facility = db.facilities.find((f: any) => f.code === facCode && f.companyId === company.id);
      if (!facility) {
        facility = {
          id: genId('FAC'),
          companyId: company.id,
          code: facCode,
          name: facName || facCode,
          city,
          status: 'ACTIVE',
        };
        db.facilities.push(facility);
        facilitiesAdded++;
      }
    }

    saveDb(db);
    res.json({
      success: true,
      message: `Bulk processed: ${companiesAdded} companies and ${facilitiesAdded} facilities added/updated.`,
      companies: db.companies,
      facilities: db.facilities,
    });
  });

  // ==========================================
  // API: Pallet Types Management
  // ==========================================
  app.get('/api/pallet-types', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.palletTypes || []);
  });

  app.post('/api/pallet-types', (req: Request, res: Response) => {
    const db = loadDb();
    const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    const newPalletType = {
      id: genId('PLT'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      material: material || 'Wood',
      lengthCm: Number(lengthCm) || 120,
      widthCm: Number(widthCm) || 100,
      heightCm: Number(heightCm) || 15,
      tareWeightKg: Number(tareWeightKg) || 20,
      maxLoadKg: Number(maxLoadKg) || 1500,
      color: color || '#16A34A',
      status: 'ACTIVE',
    };

    db.palletTypes.push(newPalletType);
    saveDb(db);
    res.json({ success: true, palletType: newPalletType });
  });

  app.put('/api/pallet-types/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const idx = (db.palletTypes || []).findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pallet type not found' });
    }
    const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color, status } = req.body;
    db.palletTypes[idx] = {
      ...db.palletTypes[idx],
      ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(material !== undefined ? { material } : {}),
      ...(lengthCm !== undefined ? { lengthCm: Number(lengthCm) } : {}),
      ...(widthCm !== undefined ? { widthCm: Number(widthCm) } : {}),
      ...(heightCm !== undefined ? { heightCm: Number(heightCm) } : {}),
      ...(tareWeightKg !== undefined ? { tareWeightKg: Number(tareWeightKg) } : {}),
      ...(maxLoadKg !== undefined ? { maxLoadKg: Number(maxLoadKg) } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    };
    saveDb(db);
    res.json({ success: true, palletType: db.palletTypes[idx] });
  });

  app.delete('/api/pallet-types/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const idx = (db.palletTypes || []).findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pallet type not found' });
    }
    const pallet = db.palletTypes[idx];

    // Check if referenced in transactions
    const inUse = (db.transactions || []).some((t: any) => t.palletTypeId === id);
    if (inUse) {
      return res.status(400).json({
        error: `Cannot delete "${pallet.name}" (${pallet.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      });
    }

    db.palletTypes.splice(idx, 1);
    saveDb(db);
    res.json({ success: true, message: `Pallet type "${pallet.name}" has been deleted.` });
  });

  // ==========================================
  // API: Document Reference Types Management
  // ==========================================
  app.get('/api/doc-ref-types', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.docRefTypes || []);
  });

  app.post('/api/doc-ref-types', (req: Request, res: Response) => {
    const db = loadDb();
    const { code, name, description, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    const newDocRefType = {
      id: genId('REF'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };

    db.docRefTypes.push(newDocRefType);
    saveDb(db);
    res.json({ success: true, docRefType: newDocRefType });
  });

  app.put('/api/doc-ref-types/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const idx = (db.docRefTypes || []).findIndex((d: any) => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Doc ref type not found' });
    }
    const { code, name, description, status } = req.body;
    db.docRefTypes[idx] = {
      ...db.docRefTypes[idx],
      ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    };
    saveDb(db);
    res.json({ success: true, docRefType: db.docRefTypes[idx] });
  });

  app.delete('/api/doc-ref-types/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const idx = (db.docRefTypes || []).findIndex((d: any) => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Doc ref type not found' });
    }
    const docRef = db.docRefTypes[idx];

    // Check if referenced in transactions
    const inUse = (db.transactions || []).some((t: any) => t.docRefTypeId === id);
    if (inUse) {
      return res.status(400).json({
        error: `Cannot delete "${docRef.name}" (${docRef.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      });
    }

    db.docRefTypes.splice(idx, 1);
    saveDb(db);
    res.json({ success: true, message: `Doc ref type "${docRef.name}" has been deleted.` });
  });

  // ==========================================
  // API: Transactions (Inbound & Outbound)
  // ==========================================
  app.get('/api/transactions', (req: Request, res: Response) => {
    const db = loadDb();
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
      txns = txns.filter((t: any) =>
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

    // Sort newest first
    txns.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(txns);
  });

  // Record Single Inbound / Outbound Pallet
  app.post('/api/transactions', (req: Request, res: Response) => {
    const db = loadDb();
    const {
      type, // 'INBOUND' | 'OUTBOUND'
      source,
      sourceLabel,
      companyId,
      facilityId,
      docRefTypeId,
      docRefNumber,
      palletTypeId,
      qty,
      notes,
      user, // logged in user payload
    } = req.body;

    if (!type || !source || !companyId || !facilityId || !docRefTypeId || !docRefNumber || !palletTypeId || !qty) {
      return res.status(400).json({ error: 'All fields are mandatory (source, company, facility, doc ref, pallet type, qty)' });
    }

    const numQty = parseInt(String(qty), 10);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const company = db.companies.find((c: any) => c.id === companyId);
    const facility = db.facilities.find((f: any) => f.id === facilityId);
    const palletType = db.palletTypes.find((p: any) => p.id === palletTypeId);
    const docRefType = db.docRefTypes.find((d: any) => d.id === docRefTypeId);

    if (!company || !facility || !palletType || !docRefType) {
      return res.status(400).json({ error: 'Invalid reference selected for company, facility, pallet type, or doc ref' });
    }

    // If outbound, check SOH validation warning/check
    if (type === 'OUTBOUND') {
      const currentStock = db.transactions
        .filter((t: any) => t.facilityId === facilityId && t.palletTypeId === palletTypeId)
        .reduce((acc: number, cur: any) => cur.type === 'INBOUND' ? acc + cur.qty : acc - cur.qty, 0);

      // Warning note if outstrips stock
      if (numQty > currentStock) {
        // Still allow warehouse override or record with notice
        console.warn(`Outbound quantity (${numQty}) exceeds current on-hand stock (${currentStock}) for facility ${facility.code}`);
      }
    }

    const newTxn = {
      id: genId(type === 'INBOUND' ? 'TXN-IB' : 'TXN-OB'),
      type: type.toUpperCase(),
      source,
      sourceLabel: sourceLabel || source,
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
      notes: notes || '',
      createdByUserId: user?.id || 'USR-01',
      createdByUsername: user?.username || 'system.user',
      createdByName: user?.fullName || 'Warehouse Operator',
      timestamp: new Date().toISOString(),
    };

    db.transactions.unshift(newTxn);
    saveDb(db);

    res.json({ success: true, transaction: newTxn, message: `${type === 'INBOUND' ? 'Received' : 'Shipped'} ${numQty} ${palletType.code} pallets successfully.` });
  });

  // Bulk Inbound / Outbound Upload
  app.post('/api/transactions/bulk', (req: Request, res: Response) => {
    const { type, rows, user, defaultCompanyId, defaultFacilityId } = req.body;
    if (!type || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Type and non-empty rows array are required' });
    }

    const db = loadDb();
    const createdTxns: any[] = [];
    const errors: string[] = [];

    rows.forEach((row: any, idx: number) => {
      try {
        const rowCompanyCode = row.Company || row.company || row.companyCode;
        const rowFacilityCode = row.Facility || row.facility || row.facilityCode;
        const rowSource = row.Source || row.source;
        const rowDocRefType = row.DocRefType || row.docRefType || row.docRefTypeName;
        const rowDocRef = row.DocRef || row.docRef || row.DocRefNumber || row.docRefNumber;
        const rowPalletType = row.PalletType || row.palletType || row.palletTypeCode;
        const rowQty = parseInt(row.Qty || row.qty || row.quantity, 10);
        const rowNotes = row.Notes || row.notes || 'Bulk CSV Upload';

        if (!rowDocRef || isNaN(rowQty) || rowQty <= 0) {
          errors.push(`Row ${idx + 1}: Missing DocRef or invalid Quantity`);
          return;
        }

        // Match company & facility
        let company = db.companies.find((c: any) => c.code === rowCompanyCode || c.name === rowCompanyCode);
        if (!company && defaultCompanyId) {
          company = db.companies.find((c: any) => c.id === defaultCompanyId);
        }
        if (!company) company = db.companies[0];

        let facility = db.facilities.find((f: any) => f.code === rowFacilityCode || f.name === rowFacilityCode);
        if (!facility && defaultFacilityId) {
          facility = db.facilities.find((f: any) => f.id === defaultFacilityId);
        }
        if (!facility) facility = db.facilities.find((f: any) => f.companyId === company.id) || db.facilities[0];

        // Match pallet type
        let pallet = db.palletTypes.find((p: any) =>
          p.code.toLowerCase() === String(rowPalletType || '').toLowerCase() ||
          p.name.toLowerCase().includes(String(rowPalletType || '').toLowerCase())
        );
        if (!pallet) pallet = db.palletTypes[0]; // fallback to wooden

        // Match doc ref type
        let docRefType = db.docRefTypes.find((d: any) =>
          d.code.toLowerCase() === String(rowDocRefType || '').toLowerCase() ||
          d.name.toLowerCase().includes(String(rowDocRefType || '').toLowerCase())
        );
        if (!docRefType) docRefType = db.docRefTypes[0];

        const txn = {
          id: genId(type === 'INBOUND' ? 'TXN-IB' : 'TXN-OB'),
          type: type.toUpperCase(),
          source: rowSource || (type === 'INBOUND' ? 'MKT_PURCHASE' : 'OUT_ORDER'),
          sourceLabel: rowSource || (type === 'INBOUND' ? 'Bulk Inbound' : 'Bulk Outbound'),
          companyId: company.id,
          companyCode: company.code,
          companyName: company.name,
          facilityId: facility.id,
          facilityCode: facility.code,
          facilityName: facility.name,
          docRefTypeId: docRefType.id,
          docRefTypeName: docRefType.name,
          docRefNumber: String(rowDocRef).trim(),
          palletTypeId: pallet.id,
          palletTypeCode: pallet.code,
          palletTypeName: pallet.name,
          qty: rowQty,
          notes: rowNotes,
          createdByUserId: user?.id || 'USR-01',
          createdByUsername: user?.username || 'bulk_operator',
          createdByName: user?.fullName || 'Bulk Uploader',
          timestamp: new Date().toISOString(),
        };

        createdTxns.push(txn);
        db.transactions.unshift(txn);
      } catch (e: any) {
        errors.push(`Row ${idx + 1}: ${e.message}`);
      }
    });

    saveDb(db);
    res.json({
      success: true,
      count: createdTxns.length,
      errors,
      message: `Successfully processed ${createdTxns.length} ${type} pallet records.`,
    });
  });

  // ==========================================
  // API: Analytics & SOH (Stock on Hand)
  // ==========================================
  app.get('/api/analytics/soh', (req: Request, res: Response) => {
    const db = loadDb();
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

  // Analytics Aggregate Overview
  app.get('/api/analytics/overview', (_req: Request, res: Response) => {
    const db = loadDb();
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
      const monthKey = t.timestamp.slice(0, 7); // YYYY-MM
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

    // Compute SOH
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

  // ==========================================
  // Vite Dev Server Integration
  // ==========================================
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Starlinks Pallet Flow] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
