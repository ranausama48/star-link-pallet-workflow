/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Building2,
  Warehouse,
  Layers,
  FileCheck,
  Cpu,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Shield,
  Upload,
  Download,
  Link,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  Power,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { api } from '../api';
import {
  UserAccount,
  UserRole,
  Company,
  Facility,
  PalletType,
  DocRefType,
  OracleWmsConfig,
  OracleWmsUser,
  ScreenId,
  PermissionLevel,
} from '../types';

interface AdminPanelProps {
  currentSubTab: string;
  currentUser: UserAccount;
  users: UserAccount[];
  companies: Company[];
  facilities: Facility[];
  palletTypes: PalletType[];
  docRefTypes: DocRefType[];
  oracleConfig: OracleWmsConfig;
  oracleUsers: OracleWmsUser[];
  onDataChanged: () => void;
}

export function AdminPanel({
  currentSubTab,
  currentUser,
  users,
  companies,
  facilities,
  palletTypes,
  docRefTypes,
  oracleConfig,
  oracleUsers,
  onDataChanged,
}: AdminPanelProps) {
  const activeTab = currentSubTab || 'admin_users';

  // Success & Error banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // -----------------------------------------------------------------
  // 1. User Management State
  // -----------------------------------------------------------------
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('Operations');
  const [userFormAssignedFaco, setUserFormAssignedFaco] = useState<Array<{ companyId: string; facilityId: string }>>([]);
  const [userFormPermissions, setUserFormPermissions] = useState<Record<ScreenId, PermissionLevel>>({
    pallet_inbound: 'edit',
    pallet_outbound: 'edit',
    analytics_soh: 'view',
    analytics_ib: 'view',
    analytics_ob: 'view',
    analytics_visuals: 'view',
    admin_users: 'none',
    admin_company: 'none',
    admin_facility: 'none',
    admin_faco: 'none',
    admin_pallets: 'none',
    admin_docref: 'none',
    admin_oracle: 'none',
  });
  const [isVerifyingWithOracle, setIsVerifyingWithOracle] = useState(false);
  const [oracleVerifyStatus, setOracleVerifyStatus] = useState<string | null>(null);

  const screensList: Array<{ id: ScreenId; label: string; desc: string }> = [
    { id: 'pallet_inbound', label: 'Pallet Inbound', desc: 'Inbound reception form & bulk upload' },
    { id: 'pallet_outbound', label: 'Pallet Outbound', desc: 'Outbound dispatch form & bulk upload' },
    { id: 'analytics_soh', label: 'Stock on Hand (SOH)', desc: 'Available stock balance & facility inventory' },
    { id: 'analytics_ib', label: 'IB Pallet Movements', desc: 'Inbound historical audit & search' },
    { id: 'analytics_ob', label: 'OB Pallet Movements', desc: 'Outbound historical audit & search' },
    { id: 'analytics_visuals', label: 'Analysis & Charts', desc: 'Bar charts, trends, and facility KPI graphs' },
    { id: 'admin_users', label: 'User Management & RBAC', desc: 'Manage users, passwords, and permissions' },
    { id: 'admin_company', label: 'Company Master', desc: 'Manage legal entities, codes & operational status' },
    { id: 'admin_facility', label: 'Facility Master', desc: 'Manage warehouses, hubs & multi-company assignments' },
    { id: 'admin_pallets', label: 'Pallet Types Master', desc: 'Manage pallet dimensions & specifications' },
    { id: 'admin_docref', label: 'Doc Ref Types', desc: 'Manage document reference categories' },
    { id: 'admin_oracle', label: 'Oracle WMS API Link', desc: 'Manage Oracle WMS connection & endpoint' },
  ];

  // Helper to open User modal for Create
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserFormUsername('');
    setUserFormFullName('');
    setUserFormEmail('');
    setUserFormPassword('password123');
    setUserFormRole('Operations');
    setUserFormAssignedFaco([{ companyId: companies[0]?.id, facilityId: facilities[0]?.id }]);
    setUserFormPermissions({
      pallet_inbound: 'edit',
      pallet_outbound: 'edit',
      analytics_soh: 'view',
      analytics_ib: 'view',
      analytics_ob: 'view',
      analytics_visuals: 'view',
      admin_users: 'none',
      admin_company: 'none',
      admin_facility: 'none',
      admin_faco: 'none',
      admin_pallets: 'none',
      admin_docref: 'none',
      admin_oracle: 'none',
    });
    setOracleVerifyStatus(null);
    setIsUserModalOpen(true);
  };

  // Helper to open User modal for Edit
  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUserFormUsername(user.username);
    setUserFormFullName(user.fullName);
    setUserFormEmail(user.email);
    setUserFormPassword(''); // blank unless changing
    setUserFormRole(user.role);
    setUserFormAssignedFaco(user.assignedFaco || []);
    setUserFormPermissions({
      pallet_inbound: user.screenPermissions?.pallet_inbound || 'view',
      pallet_outbound: user.screenPermissions?.pallet_outbound || 'view',
      analytics_soh: user.screenPermissions?.analytics_soh || 'view',
      analytics_ib: user.screenPermissions?.analytics_ib || 'view',
      analytics_ob: user.screenPermissions?.analytics_ob || 'view',
      analytics_visuals: user.screenPermissions?.analytics_visuals || 'view',
      admin_users: user.screenPermissions?.admin_users || 'none',
      admin_company: user.screenPermissions?.admin_company || user.screenPermissions?.admin_faco || 'none',
      admin_facility: user.screenPermissions?.admin_facility || user.screenPermissions?.admin_faco || 'none',
      admin_faco: user.screenPermissions?.admin_faco || 'none',
      admin_pallets: user.screenPermissions?.admin_pallets || 'none',
      admin_docref: user.screenPermissions?.admin_docref || 'none',
      admin_oracle: user.screenPermissions?.admin_oracle || 'none',
    });
    setOracleVerifyStatus('Verified in Oracle WMS');
    setIsUserModalOpen(true);
  };

  // Verify username in Oracle WMS during creation
  const handleVerifyInOracle = async () => {
    if (!userFormUsername.trim()) {
      setErrorMsg('Please enter a username to verify with Oracle WMS');
      return;
    }
    setIsVerifyingWithOracle(true);
    setOracleVerifyStatus(null);
    try {
      const res = await api.verifyOracleUser(userFormUsername.trim());
      setUserFormFullName(res.oracleUser.fullName);
      setUserFormEmail(res.oracleUser.email);
      setOracleVerifyStatus(`Verified: ${res.oracleUser.fullName} (${res.oracleUser.oracleRole})`);
      setSuccessMsg(`Oracle WMS user verified: ${res.oracleUser.fullName}`);
    } catch (err: any) {
      setOracleVerifyStatus(`Verification Notice: ${err.message}`);
    } finally {
      setIsVerifyingWithOracle(false);
    }
  };

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        username: userFormUsername.trim(),
        fullName: userFormFullName.trim(),
        email: userFormEmail.trim(),
        role: userFormRole,
        assignedFaco: userFormAssignedFaco,
        screenPermissions: userFormPermissions,
      };
      if (userFormPassword) {
        payload.password = userFormPassword;
      }

      if (editingUserId) {
        await api.updateUser(editingUserId, payload);
        setSuccessMsg(`User ${userFormUsername} updated successfully.`);
      } else {
        await api.createUser(payload);
        setSuccessMsg(`User ${userFormUsername} created and permissions assigned.`);
      }

      setIsUserModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save user');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      setSuccessMsg(`User ${name} removed.`);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    }
  };

  // -----------------------------------------------------------------
  // 2. Company Master State & Handlers
  // -----------------------------------------------------------------
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyStatus, setCompanyStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [companySearchText, setCompanySearchText] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const handleOpenCreateCompany = () => {
    setEditingCompanyId(null);
    setCompanyCode('');
    setCompanyName('');
    setCompanyStatus('ACTIVE');
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: Company) => {
    setEditingCompanyId(comp.id);
    setCompanyCode(comp.code);
    setCompanyName(comp.name);
    setCompanyStatus(comp.status || 'ACTIVE');
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim() || !companyName.trim()) return;
    try {
      if (editingCompanyId) {
        await api.updateCompany(editingCompanyId, {
          code: companyCode.trim().toUpperCase(),
          name: companyName.trim(),
          status: companyStatus,
        });
        setSuccessMsg(`Company "${companyName}" updated successfully.`);
      } else {
        await api.createCompany(companyCode.trim().toUpperCase(), companyName.trim());
        setSuccessMsg(`Company "${companyName}" created successfully.`);
      }
      setIsCompanyModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save company');
    }
  };

  const handleToggleCompanyStatus = async (comp: Company) => {
    const nextStatus = comp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateCompany(comp.id, { status: nextStatus });
      setSuccessMsg(`Company "${comp.name}" has been ${nextStatus === 'ACTIVE' ? 'Enabled' : 'Disabled'}.`);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company status');
    }
  };

  // -----------------------------------------------------------------
  // 3. Facility Master State & Handlers
  // -----------------------------------------------------------------
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facilityCode, setFacilityCode] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [facilityCompanyIds, setFacilityCompanyIds] = useState<string[]>([]);
  const [facilityStatus, setFacilityStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [facilitySearchText, setFacilitySearchText] = useState('');
  const [facilityCompanyFilter, setFacilityCompanyFilter] = useState<string>('ALL');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isCompMultiDropdownOpen, setIsCompMultiDropdownOpen] = useState(false);
  const [compDropdownSearch, setCompDropdownSearch] = useState('');

  const handleOpenCreateFacility = () => {
    setEditingFacilityId(null);
    setFacilityCode('');
    setFacilityName('');
    setFacilityCity('');
    const firstActiveComp = companies.find((c) => c.status !== 'INACTIVE') || companies[0];
    setFacilityCompanyIds(firstActiveComp ? [firstActiveComp.id] : []);
    setFacilityStatus('ACTIVE');
    setIsCompMultiDropdownOpen(false);
    setCompDropdownSearch('');
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (fac: Facility) => {
    setEditingFacilityId(fac.id);
    setFacilityCode(fac.code);
    setFacilityName(fac.name);
    setFacilityCity(fac.city || '');
    const assignedIds =
      fac.companyIds && fac.companyIds.length > 0
        ? fac.companyIds
        : fac.companyId
        ? [fac.companyId]
        : [];
    setFacilityCompanyIds(assignedIds);
    setFacilityStatus(fac.status || 'ACTIVE');
    setIsCompMultiDropdownOpen(false);
    setCompDropdownSearch('');
    setIsFacilityModalOpen(true);
  };

  const handleToggleCompanyInFacility = (compId: string) => {
    setFacilityCompanyIds((prev) => {
      if (prev.includes(compId)) {
        return prev.filter((id) => id !== compId);
      } else {
        return [...prev, compId];
      }
    });
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityCode.trim() || !facilityName.trim()) return;
    if (facilityCompanyIds.length === 0) {
      setErrorMsg('Please select at least one company from the defined companies dropdown list.');
      return;
    }
    try {
      if (editingFacilityId) {
        await api.updateFacility(editingFacilityId, {
          code: facilityCode.trim().toUpperCase(),
          name: facilityName.trim(),
          city: facilityCity.trim(),
          companyIds: facilityCompanyIds,
          companyId: facilityCompanyIds[0],
          status: facilityStatus,
        });
        setSuccessMsg(`Facility "${facilityName}" updated successfully.`);
      } else {
        await api.createFacility({
          companyIds: facilityCompanyIds,
          companyId: facilityCompanyIds[0],
          code: facilityCode.trim().toUpperCase(),
          name: facilityName.trim(),
          city: facilityCity.trim(),
          status: facilityStatus,
        });
        setSuccessMsg(`Facility "${facilityName}" created successfully.`);
      }
      setIsFacilityModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save facility');
    }
  };

  const handleToggleFacilityStatus = async (fac: Facility) => {
    const nextStatus = fac.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateFacility(fac.id, { status: nextStatus });
      setSuccessMsg(`Facility "${fac.name}" has been ${nextStatus === 'ACTIVE' ? 'Enabled' : 'Disabled'}.`);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update facility status');
    }
  };

  // -----------------------------------------------------------------
  // 3. Pallet Types Master State
  // -----------------------------------------------------------------
  const [isPalletModalOpen, setIsPalletModalOpen] = useState(false);
  const [editingPalletId, setEditingPalletId] = useState<string | null>(null);
  const [palletCode, setPalletCode] = useState('');
  const [palletName, setPalletName] = useState('');
  const [palletLength, setPalletLength] = useState('120');
  const [palletWidth, setPalletWidth] = useState('100');
  const [palletHeight, setPalletHeight] = useState('15');
  const [palletTare, setPalletTare] = useState('22');
  const [palletMaxLoad, setPalletMaxLoad] = useState('1500');
  const [palletMaterial, setPalletMaterial] = useState<'Wood' | 'Plastic' | 'Metal' | 'Composite'>('Wood');
  const [palletStatus, setPalletStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [palletSearchText, setPalletSearchText] = useState('');
  const [palletStatusFilter, setPalletStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [palletMaterialFilter, setPalletMaterialFilter] = useState<string>('ALL');
  const [deletingPallet, setDeletingPallet] = useState<PalletType | null>(null);

  const handleOpenAddPallet = () => {
    setEditingPalletId(null);
    setPalletCode('');
    setPalletName('');
    setPalletLength('120');
    setPalletWidth('100');
    setPalletHeight('15');
    setPalletTare('22');
    setPalletMaxLoad('1500');
    setPalletMaterial('Wood');
    setPalletStatus('ACTIVE');
    setIsPalletModalOpen(true);
  };

  const handleOpenEditPallet = (p: PalletType) => {
    setEditingPalletId(p.id);
    setPalletCode(p.code);
    setPalletName(p.name);
    setPalletLength(String(p.lengthCm ?? 120));
    setPalletWidth(String(p.widthCm ?? 100));
    setPalletHeight(String(p.heightCm ?? 15));
    setPalletTare(String(p.tareWeightKg ?? 22));
    setPalletMaxLoad(String(p.maxLoadKg ?? 1500));
    setPalletMaterial((p.material as any) || 'Wood');
    setPalletStatus(p.status || 'ACTIVE');
    setIsPalletModalOpen(true);
  };

  const handleSavePalletType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palletCode.trim() || !palletName.trim()) {
      setErrorMsg('Code and Pallet Name are required.');
      return;
    }
    try {
      if (editingPalletId) {
        await api.updatePalletType(editingPalletId, {
          code: palletCode.trim().toUpperCase(),
          name: palletName.trim(),
          lengthCm: Number(palletLength) || 120,
          widthCm: Number(palletWidth) || 100,
          heightCm: Number(palletHeight) || 15,
          tareWeightKg: Number(palletTare) || 20,
          maxLoadKg: Number(palletMaxLoad) || 1500,
          material: palletMaterial,
          status: palletStatus,
        });
        setSuccessMsg(`Pallet specification "${palletName.trim()}" updated successfully.`);
      } else {
        await api.createPalletType({
          code: palletCode.trim().toUpperCase(),
          name: palletName.trim(),
          lengthCm: Number(palletLength) || 120,
          widthCm: Number(palletWidth) || 100,
          heightCm: Number(palletHeight) || 15,
          tareWeightKg: Number(palletTare) || 20,
          maxLoadKg: Number(palletMaxLoad) || 1500,
          material: palletMaterial,
          status: palletStatus,
        });
        setSuccessMsg(`Pallet specification "${palletName.trim()}" created successfully.`);
      }
      setIsPalletModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save pallet type');
    }
  };

  const handleTogglePalletStatus = async (p: PalletType) => {
    const nextStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updatePalletType(p.id, { status: nextStatus });
      setSuccessMsg(`Pallet type "${p.name}" has been ${nextStatus === 'ACTIVE' ? 'Enabled' : 'Disabled'}.`);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update pallet status');
    }
  };

  const handleConfirmDeletePallet = async () => {
    if (!deletingPallet) return;
    try {
      const res = await api.deletePalletType(deletingPallet.id);
      setSuccessMsg(res.message || `Pallet type "${deletingPallet.name}" deleted.`);
      setDeletingPallet(null);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete pallet type');
      setDeletingPallet(null);
    }
  };

  // -----------------------------------------------------------------
  // 4. Doc Ref Types Master State
  // -----------------------------------------------------------------
  const [isDocRefModalOpen, setIsDocRefModalOpen] = useState(false);
  const [editingDocRefId, setEditingDocRefId] = useState<string | null>(null);
  const [docRefCode, setDocRefCode] = useState('');
  const [docRefName, setDocRefName] = useState('');
  const [docRefDesc, setDocRefDesc] = useState('');
  const [docRefStatus, setDocRefStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [docRefSearchText, setDocRefSearchText] = useState('');
  const [docRefStatusFilter, setDocRefStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deletingDocRef, setDeletingDocRef] = useState<DocRefType | null>(null);

  const handleOpenAddDocRef = () => {
    setEditingDocRefId(null);
    setDocRefCode('');
    setDocRefName('');
    setDocRefDesc('');
    setDocRefStatus('ACTIVE');
    setIsDocRefModalOpen(true);
  };

  const handleOpenEditDocRef = (d: DocRefType) => {
    setEditingDocRefId(d.id);
    setDocRefCode(d.code);
    setDocRefName(d.name);
    setDocRefDesc(d.description || '');
    setDocRefStatus(d.status || 'ACTIVE');
    setIsDocRefModalOpen(true);
  };

  const handleSaveDocRefType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRefCode.trim() || !docRefName.trim()) {
      setErrorMsg('Doc Code and Doc Type Name are required.');
      return;
    }
    try {
      if (editingDocRefId) {
        await api.updateDocRefType(editingDocRefId, {
          code: docRefCode.trim().toUpperCase(),
          name: docRefName.trim(),
          description: docRefDesc.trim(),
          status: docRefStatus,
        });
        setSuccessMsg(`Doc Ref Type "${docRefName.trim()}" updated successfully.`);
      } else {
        await api.createDocRefType({
          code: docRefCode.trim().toUpperCase(),
          name: docRefName.trim(),
          description: docRefDesc.trim(),
          status: docRefStatus,
        });
        setSuccessMsg(`Doc Ref Type "${docRefName.trim()}" created successfully.`);
      }
      setIsDocRefModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save doc ref type');
    }
  };

  const handleToggleDocRefStatus = async (d: DocRefType) => {
    const nextStatus = d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateDocRefType(d.id, { status: nextStatus });
      setSuccessMsg(`Doc Ref Type "${d.name}" has been ${nextStatus === 'ACTIVE' ? 'Enabled' : 'Disabled'}.`);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update doc ref status');
    }
  };

  const handleConfirmDeleteDocRef = async () => {
    if (!deletingDocRef) return;
    try {
      const res = await api.deleteDocRefType(deletingDocRef.id);
      setSuccessMsg(res.message || `Doc ref type "${deletingDocRef.name}" deleted.`);
      setDeletingDocRef(null);
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete doc ref type');
      setDeletingDocRef(null);
    }
  };

  // -----------------------------------------------------------------
  // 5. Oracle WMS API Configuration State
  // -----------------------------------------------------------------
  const [oracleApiUrl, setOracleApiUrl] = useState(oracleConfig.apiUrl || '');
  const [oracleAuthType, setOracleAuthType] = useState(oracleConfig.authType || 'SIMULATED');
  const [oracleApiKey, setOracleApiKey] = useState(oracleConfig.apiKeyOrToken || '');
  const [oracleUsername, setOracleUsername] = useState(oracleConfig.username || '');
  const [oraclePassword, setOraclePassword] = useState(oracleConfig.password || '');
  const [isTestingOracle, setIsTestingOracle] = useState(false);
  const [oracleTestResult, setOracleTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    status?: number;
  } | null>(null);

  const handleSaveOracleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateOracleConfig({
        apiUrl: oracleApiUrl,
        authType: oracleAuthType,
        apiKeyOrToken: oracleApiKey,
        username: oracleUsername,
        password: oraclePassword,
        enabled: true,
      });
      setSuccessMsg('Oracle WMS API configuration saved.');
      onDataChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleTestOracleConnection = async () => {
    setIsTestingOracle(true);
    setOracleTestResult(null);
    try {
      const res = await api.testOracleConnection({
        apiUrl: oracleApiUrl,
        authType: oracleAuthType,
        apiKeyOrToken: oracleApiKey,
        username: oracleUsername,
        password: oraclePassword,
      });
      setOracleTestResult(res);
      if (res.success) {
        setSuccessMsg(`Oracle WMS Connection Successful (${res.latencyMs}ms)`);
      }
    } catch (err: any) {
      setOracleTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTestingOracle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Administration & Master Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System Administration Panel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure users, FACO mapping, pallet masters, and Oracle WMS API connectivity.
          </p>
        </div>

        {/* Active Module Indicator (Navigation managed via Menu Navigator) */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>
              {activeTab === 'admin_users' && 'Users & Access Control (RBAC)'}
              {(activeTab === 'admin_company' || activeTab === 'admin_faco') && 'Company Master (Defined Companies)'}
              {activeTab === 'admin_facility' && 'Facility Master (Warehouses & Multi-Company)'}
              {activeTab === 'admin_pallets' && 'Pallet Types Master'}
              {activeTab === 'admin_docref' && 'Doc Ref Types Master'}
              {activeTab === 'admin_oracle' && 'Oracle WMS API Link'}
            </span>
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="font-bold text-emerald-700">
            ×
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="font-bold text-red-700">
            ×
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. USERS & RBAC TAB                                            */}
      {/* ============================================================== */}
      {activeTab === 'admin_users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Accounts & Access Control (RBAC)</h3>
              <p className="text-xs text-slate-500">
                Assign roles, multiple Company/Facility (FACO) assignments, and granular UI screen permissions.
              </p>
            </div>
            {currentUser.role === 'Admin' ? (
              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New User</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Management: View Only (User editing disabled)</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Oracle Sync</th>
                  <th className="py-2.5 px-4">Assigned FACO</th>
                  <th className="py-2.5 px-4">Permissions</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.username} · {u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'Admin'
                            ? 'bg-emerald-100 text-emerald-900'
                            : u.role === 'Management'
                            ? 'bg-blue-100 text-blue-900'
                            : u.role === 'Operations'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Oracle Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="text-[11px] text-slate-700 font-semibold">
                        {u.assignedFaco?.length || 0} Facilities Assigned
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                        {u.assignedFaco
                          ?.map((f) => facilities.find((fac) => fac.id === f.facilityId)?.code)
                          .filter(Boolean)
                          .join(', ') || 'None'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="text-[11px] text-slate-600">
                        {u.role === 'Admin' ? 'All (Root Admin)' : 'Custom Matrix'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {currentUser.role === 'Admin' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded"
                            title="Edit User & Permissions"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.username !== 'obaidullah.r' && u.username !== 'admin.starlinks' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. COMPANY MASTER (SEPARATE UI)                                */}
      {/* ============================================================== */}
      {(activeTab === 'admin_company' || activeTab === 'admin_faco') && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">Company Master Registry</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Defined legal entities and operational logistics companies. Manage codes, names, and active status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateCompany}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Company
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companySearchText}
                  onChange={(e) => setCompanySearchText(e.target.value)}
                  placeholder="Search company code or name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Status:</span>
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCompanyStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      companyStatusFilter === st
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Showing {
                companies.filter((comp) => {
                  const matchesSearch =
                    comp.code.toLowerCase().includes(companySearchText.toLowerCase().trim()) ||
                    comp.name.toLowerCase().includes(companySearchText.toLowerCase().trim());
                  const matchesStatus =
                    companyStatusFilter === 'ALL'
                      ? true
                      : companyStatusFilter === 'ACTIVE'
                      ? comp.status !== 'INACTIVE'
                      : comp.status === 'INACTIVE';
                  return matchesSearch && matchesStatus;
                }).length
              } of {companies.length} companies
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Company Code</th>
                    <th className="py-2.5 px-4">Company Name</th>
                    <th className="py-2.5 px-4">Operating Facilities</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {companies
                    .filter((comp) => {
                      const matchesSearch =
                        comp.code.toLowerCase().includes(companySearchText.toLowerCase().trim()) ||
                        comp.name.toLowerCase().includes(companySearchText.toLowerCase().trim());
                      const matchesStatus =
                        companyStatusFilter === 'ALL'
                          ? true
                          : companyStatusFilter === 'ACTIVE'
                          ? comp.status !== 'INACTIVE'
                          : comp.status === 'INACTIVE';
                      return matchesSearch && matchesStatus;
                    })
                    .map((comp) => {
                      const operatingFacilities = facilities.filter(
                        (f) =>
                          (f.companyIds && Array.isArray(f.companyIds) && f.companyIds.includes(comp.id)) ||
                          f.companyId === comp.id
                      );
                      const isInactive = comp.status === 'INACTIVE';

                      return (
                        <tr
                          key={comp.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isInactive ? 'bg-slate-50/50 opacity-75' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-800">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {comp.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block text-xs">{comp.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {comp.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-600 mr-1">
                                {operatingFacilities.length} {operatingFacilities.length === 1 ? 'Hub' : 'Hubs'}:
                              </span>
                              {operatingFacilities.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">No facilities linked</span>
                              ) : (
                                operatingFacilities.map((f) => (
                                  <span
                                    key={f.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                                    title={`${f.name} (${f.city})`}
                                  >
                                    {f.code}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Option at Admin Level */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCompany(comp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Edit Company"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit</span>
                              </button>

                              {/* Enable / Disable Option */}
                              <button
                                type="button"
                                onClick={() => handleToggleCompanyStatus(comp)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                                  isInactive
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                                title={isInactive ? 'Enable this company' : 'Disable this company'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isInactive ? 'Enable' : 'Disable'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No companies configured yet. Click "Add Company" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FACILITY MASTER (SEPARATE UI WITH MULTI-COMPANY SUPPORT)    */}
      {/* ============================================================== */}
      {activeTab === 'admin_facility' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">Facility Master Registry</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Warehouse hubs and cross-docks. Defined companies are assigned per facility with multi-selection support.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateFacility}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Facility
              </button>
            </div>
          </div>

          {/* Filters Bar with Defined Companies Dropdown Filter */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Defined Companies Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Filter by Company:</label>
                <select
                  value={facilityCompanyFilter}
                  onChange={(e) => setFacilityCompanyFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="ALL">All Defined Companies ({companies.length})</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} {c.status === 'INACTIVE' ? '(Disabled)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={facilitySearchText}
                  onChange={(e) => setFacilitySearchText(e.target.value)}
                  placeholder="Search code, name, city..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFacilityStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      facilityStatusFilter === st
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Showing {
                facilities.filter((fac) => {
                  const matchesSearch =
                    fac.code.toLowerCase().includes(facilitySearchText.toLowerCase().trim()) ||
                    fac.name.toLowerCase().includes(facilitySearchText.toLowerCase().trim()) ||
                    (fac.city && fac.city.toLowerCase().includes(facilitySearchText.toLowerCase().trim()));
                  const assignedIds =
                    fac.companyIds && fac.companyIds.length > 0
                      ? fac.companyIds
                      : fac.companyId
                      ? [fac.companyId]
                      : [];
                  const matchesCompany =
                    facilityCompanyFilter === 'ALL' || assignedIds.includes(facilityCompanyFilter);
                  const matchesStatus =
                    facilityStatusFilter === 'ALL'
                      ? true
                      : facilityStatusFilter === 'ACTIVE'
                      ? fac.status !== 'INACTIVE'
                      : fac.status === 'INACTIVE';
                  return matchesSearch && matchesCompany && matchesStatus;
                }).length
              } of {facilities.length} facilities
            </div>
          </div>

          {/* Facilities Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Facility Code</th>
                    <th className="py-2.5 px-4">Facility Name</th>
                    <th className="py-2.5 px-4">City / Location</th>
                    <th className="py-2.5 px-4">Defined Companies (Multi-Company)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {facilities
                    .filter((fac) => {
                      const matchesSearch =
                        fac.code.toLowerCase().includes(facilitySearchText.toLowerCase().trim()) ||
                        fac.name.toLowerCase().includes(facilitySearchText.toLowerCase().trim()) ||
                        (fac.city && fac.city.toLowerCase().includes(facilitySearchText.toLowerCase().trim()));
                      const assignedIds =
                        fac.companyIds && fac.companyIds.length > 0
                          ? fac.companyIds
                          : fac.companyId
                          ? [fac.companyId]
                          : [];
                      const matchesCompany =
                        facilityCompanyFilter === 'ALL' || assignedIds.includes(facilityCompanyFilter);
                      const matchesStatus =
                        facilityStatusFilter === 'ALL'
                          ? true
                          : facilityStatusFilter === 'ACTIVE'
                          ? fac.status !== 'INACTIVE'
                          : fac.status === 'INACTIVE';
                      return matchesSearch && matchesCompany && matchesStatus;
                    })
                    .map((fac) => {
                      const assignedIds =
                        fac.companyIds && fac.companyIds.length > 0
                          ? fac.companyIds
                          : fac.companyId
                          ? [fac.companyId]
                          : [];
                      const assignedCompList = companies.filter((c) => assignedIds.includes(c.id));
                      const isInactive = fac.status === 'INACTIVE';

                      return (
                        <tr
                          key={fac.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isInactive ? 'bg-slate-50/50 opacity-75' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                            {fac.code}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block text-xs">{fac.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {fac.id}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {fac.city || 'Central Hub'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {assignedCompList.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">No company linked</span>
                              ) : (
                                assignedCompList.map((comp) => (
                                  <span
                                    key={comp.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                                    title={comp.name}
                                  >
                                    {comp.code}
                                  </span>
                                ))
                              )}
                              {assignedCompList.length > 1 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                  Shared ({assignedCompList.length})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Option at Admin Level */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditFacility(fac)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Edit Facility"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit</span>
                              </button>

                              {/* Enable / Disable Option */}
                              <button
                                type="button"
                                onClick={() => handleToggleFacilityStatus(fac)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                                  isInactive
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                                title={isInactive ? 'Enable this facility' : 'Disable this facility'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isInactive ? 'Enable' : 'Disable'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {facilities.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No facilities configured yet. Click "Add Facility" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PALLET TYPES MASTER TAB                                     */}
      {/* ============================================================== */}
      {activeTab === 'admin_pallets' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">Pallet Types Master Registry</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin master for pallet codes, dimensions (L×W×H cm), tare weights, materials, and load ratings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddPallet}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Pallet Type
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={palletSearchText}
                  onChange={(e) => setPalletSearchText(e.target.value)}
                  placeholder="Search code, pallet name, material..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                />
              </div>

              {/* Material Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-medium">Material:</span>
                <select
                  value={palletMaterialFilter}
                  onChange={(e) => setPalletMaterialFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                >
                  <option value="ALL">All Materials</option>
                  <option value="Wood">Wood</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Metal">Metal</option>
                  <option value="Composite">Composite</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Status:</span>
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPalletStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      palletStatusFilter === st
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Showing{' '}
              {
                palletTypes.filter((p) => {
                  const matchSearch =
                    p.code.toLowerCase().includes(palletSearchText.toLowerCase().trim()) ||
                    p.name.toLowerCase().includes(palletSearchText.toLowerCase().trim()) ||
                    (p.material || '').toLowerCase().includes(palletSearchText.toLowerCase().trim());
                  const matchStatus =
                    palletStatusFilter === 'ALL'
                      ? true
                      : palletStatusFilter === 'ACTIVE'
                      ? p.status !== 'INACTIVE'
                      : p.status === 'INACTIVE';
                  const matchMaterial =
                    palletMaterialFilter === 'ALL' ? true : p.material === palletMaterialFilter;
                  return matchSearch && matchStatus && matchMaterial;
                }).length
              } of {palletTypes.length} types
            </div>
          </div>

          {/* Pallet Types Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Pallet Name</th>
                    <th className="py-2.5 px-4">Material</th>
                    <th className="py-2.5 px-4">Dimensions (L × W × H)</th>
                    <th className="py-2.5 px-4 text-right">Tare Weight</th>
                    <th className="py-2.5 px-4 text-right">Max Load</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {palletTypes
                    .filter((p) => {
                      const matchSearch =
                        p.code.toLowerCase().includes(palletSearchText.toLowerCase().trim()) ||
                        p.name.toLowerCase().includes(palletSearchText.toLowerCase().trim()) ||
                        (p.material || '').toLowerCase().includes(palletSearchText.toLowerCase().trim());
                      const matchStatus =
                        palletStatusFilter === 'ALL'
                          ? true
                          : palletStatusFilter === 'ACTIVE'
                          ? p.status !== 'INACTIVE'
                          : p.status === 'INACTIVE';
                      const matchMaterial =
                        palletMaterialFilter === 'ALL' ? true : p.material === palletMaterialFilter;
                      return matchSearch && matchStatus && matchMaterial;
                    })
                    .map((p) => {
                      const isInactive = p.status === 'INACTIVE';
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isInactive ? 'bg-slate-50/50 opacity-75' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-800">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {p.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {p.name}
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {p.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                p.material === 'Wood'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : p.material === 'Plastic'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : p.material === 'Metal'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              {p.material || 'Wood'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {p.lengthCm} × {p.widthCm} × {p.heightCm} cm
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            {p.tareWeightKg} kg
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {p.maxLoadKg ? p.maxLoadKg.toLocaleString() : '—'} kg
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Option */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditPallet(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Edit Pallet Specification"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit</span>
                              </button>

                              {/* Enable / Disable Option */}
                              <button
                                type="button"
                                onClick={() => handleTogglePalletStatus(p)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                                  isInactive
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                                title={isInactive ? 'Enable this pallet type' : 'Disable this pallet type'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isInactive ? 'Enable' : 'Disable'}</span>
                              </button>

                              {/* Delete Option */}
                              <button
                                type="button"
                                onClick={() => setDeletingPallet(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Delete Pallet Type"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {palletTypes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        No pallet specifications defined yet. Click "Add Pallet Type" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DOC REF TYPES MASTER TAB                                    */}
      {/* ============================================================== */}
      {activeTab === 'admin_docref' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">Document Reference Types Master</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Document types recognized during Inbound and Outbound transactions (Shipment #, PO#, Orders, Transfer Orders, ASN).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddDocRef}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Doc Ref Type
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docRefSearchText}
                  onChange={(e) => setDocRefSearchText(e.target.value)}
                  placeholder="Search code, doc name, description..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Status:</span>
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDocRefStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      docRefStatusFilter === st
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Showing{' '}
              {
                docRefTypes.filter((d) => {
                  const matchSearch =
                    d.code.toLowerCase().includes(docRefSearchText.toLowerCase().trim()) ||
                    d.name.toLowerCase().includes(docRefSearchText.toLowerCase().trim()) ||
                    (d.description || '').toLowerCase().includes(docRefSearchText.toLowerCase().trim());
                  const matchStatus =
                    docRefStatusFilter === 'ALL'
                      ? true
                      : docRefStatusFilter === 'ACTIVE'
                      ? d.status !== 'INACTIVE'
                      : d.status === 'INACTIVE';
                  return matchSearch && matchStatus;
                }).length
              } of {docRefTypes.length} doc types
            </div>
          </div>

          {/* Doc Ref Types Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Document Type Name</th>
                    <th className="py-2.5 px-4">Description / Logistics Use</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {docRefTypes
                    .filter((d) => {
                      const matchSearch =
                        d.code.toLowerCase().includes(docRefSearchText.toLowerCase().trim()) ||
                        d.name.toLowerCase().includes(docRefSearchText.toLowerCase().trim()) ||
                        (d.description || '').toLowerCase().includes(docRefSearchText.toLowerCase().trim());
                      const matchStatus =
                        docRefStatusFilter === 'ALL'
                          ? true
                          : docRefStatusFilter === 'ACTIVE'
                          ? d.status !== 'INACTIVE'
                          : d.status === 'INACTIVE';
                      return matchSearch && matchStatus;
                    })
                    .map((d) => {
                      const isInactive = d.status === 'INACTIVE';
                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isInactive ? 'bg-slate-50/50 opacity-75' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-800">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {d.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {d.name}
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {d.id}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {d.description || <span className="text-slate-400 italic">No description provided</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Option */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditDocRef(d)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Edit Doc Ref Type"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit</span>
                              </button>

                              {/* Enable / Disable Option */}
                              <button
                                type="button"
                                onClick={() => handleToggleDocRefStatus(d)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                                  isInactive
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                                title={isInactive ? 'Enable this doc type' : 'Disable this doc type'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isInactive ? 'Enable' : 'Disable'}</span>
                              </button>

                              {/* Delete Option */}
                              <button
                                type="button"
                                onClick={() => setDeletingDocRef(d)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Delete Doc Ref Type"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {docRefTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No document reference types defined yet. Click "Add Doc Ref Type" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. ORACLE WMS API LINK CONFIGURATION TAB                       */}
      {/* ============================================================== */}
      {activeTab === 'admin_oracle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Config Form (Left) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-800" />
                Oracle WMS API Connection Settings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin can configure or change the Oracle Cloud WMS API link, authentication tokens, and test connectivity.
              </p>
            </div>

            <form onSubmit={handleSaveOracleConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oracle WMS API Endpoint URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={oracleApiUrl}
                    onChange={(e) => setOracleApiUrl(e.target.value)}
                    placeholder="https://wms-saas.oraclecloud.com/starlinks_wms/lgf/api/v2/entity/user"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Target REST endpoint for validating warehouse operators during login and user provisioning.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authentication Protocol
                  </label>
                  <select
                    value={oracleAuthType}
                    onChange={(e) => setOracleAuthType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="SIMULATED">Simulated Enterprise Sandbox (Ready & Verified)</option>
                    <option value="BEARER">OAuth 2.0 / Bearer Token</option>
                    <option value="BASIC">HTTP Basic Auth (User & Pass)</option>
                    <option value="HEADER_KEY">Custom API-Key Header</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    API Token / Key
                  </label>
                  <input
                    type="password"
                    value={oracleApiKey}
                    onChange={(e) => setOracleApiKey(e.target.value)}
                    placeholder="stl_wms_prod_live_key_99214"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {oracleAuthType === 'BASIC' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Service User</label>
                    <input
                      type="text"
                      value={oracleUsername}
                      onChange={(e) => setOracleUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={oraclePassword}
                      onChange={(e) => setOraclePassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
                >
                  Save API Configuration
                </button>

                <button
                  type="button"
                  onClick={handleTestOracleConnection}
                  disabled={isTestingOracle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingOracle ? 'animate-spin' : ''}`} />
                  {isTestingOracle ? 'Testing Ping...' : 'Test Oracle WMS Connection'}
                </button>
              </div>

              {/* Test Connection Results */}
              {oracleTestResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    oracleTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {oracleTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {oracleTestResult.success ? 'Connection Verified' : 'Connection Note'}
                    </div>
                    <div className="text-[11px] mt-0.5">{oracleTestResult.message}</div>
                    {oracleTestResult.latencyMs && (
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        Response Latency: {oracleTestResult.latencyMs} ms · HTTP Status: {oracleTestResult.status || 200}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Synced Oracle WMS User Directory (Right) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Oracle WMS Synced Directory
                </h3>
                <p className="text-[11px] text-slate-400">Users eligible to create passwords</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">
                {oracleUsers.length} Users
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {oracleUsers.map((ou) => (
                <div
                  key={ou.username}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{ou.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      @{ou.username} · {ou.department}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-900 font-semibold">
                    {ou.oracleRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT USER WITH RBAC & FACO & PERMISSIONS CHECKBOXES */}
      {/* ============================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingUserId ? 'Edit User Permissions & FACO' : 'Create & Onboard User'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* User credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Oracle WMS Username <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={userFormUsername}
                      onChange={(e) => setUserFormUsername(e.target.value)}
                      placeholder="e.g. khalid.ops"
                      required
                      disabled={Boolean(editingUserId)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 disabled:opacity-60"
                    />
                    {!editingUserId && (
                      <button
                        type="button"
                        onClick={handleVerifyInOracle}
                        disabled={isVerifyingWithOracle}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-900 rounded-lg hover:bg-emerald-200"
                      >
                        {isVerifyingWithOracle ? '...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  {oracleVerifyStatus && (
                    <span className="text-[10px] text-emerald-800 font-medium block mt-1">
                      {oracleVerifyStatus}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userFormFullName}
                    onChange={(e) => setUserFormFullName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Assignment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormRole}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setUserFormRole(newRole);
                      // Apply role defaults
                      if (newRole === 'Admin') {
                        setUserFormPermissions({
                          pallet_inbound: 'all',
                          pallet_outbound: 'all',
                          analytics_soh: 'all',
                          analytics_ib: 'all',
                          analytics_ob: 'all',
                          analytics_visuals: 'all',
                          admin_users: 'all',
                          admin_company: 'all',
                          admin_facility: 'all',
                          admin_faco: 'all',
                          admin_pallets: 'all',
                          admin_docref: 'all',
                          admin_oracle: 'all',
                        });
                      } else if (newRole === 'Operations') {
                        setUserFormPermissions({
                          pallet_inbound: 'edit',
                          pallet_outbound: 'edit',
                          analytics_soh: 'view',
                          analytics_ib: 'view',
                          analytics_ob: 'view',
                          analytics_visuals: 'view',
                          admin_users: 'none',
                          admin_company: 'none',
                          admin_facility: 'none',
                          admin_faco: 'none',
                          admin_pallets: 'none',
                          admin_docref: 'none',
                          admin_oracle: 'none',
                        });
                      } else if (newRole === 'Management') {
                        setUserFormPermissions({
                          pallet_inbound: 'view',
                          pallet_outbound: 'view',
                          analytics_soh: 'view',
                          analytics_ib: 'view',
                          analytics_ob: 'view',
                          analytics_visuals: 'view',
                          admin_users: 'none',
                          admin_company: 'view',
                          admin_facility: 'view',
                          admin_faco: 'view',
                          admin_pallets: 'view',
                          admin_docref: 'view',
                          admin_oracle: 'none',
                        });
                      } else {
                        // Inquiry
                        setUserFormPermissions({
                          pallet_inbound: 'view',
                          pallet_outbound: 'view',
                          analytics_soh: 'view',
                          analytics_ib: 'view',
                          analytics_ob: 'view',
                          analytics_visuals: 'view',
                          admin_users: 'none',
                          admin_company: 'none',
                          admin_facility: 'none',
                          admin_faco: 'none',
                          admin_pallets: 'none',
                          admin_docref: 'none',
                          admin_oracle: 'none',
                        });
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold"
                  >
                    <option value="Admin">Admin (Full access)</option>
                    <option value="Management">Management (All views, no user creation)</option>
                    <option value="Operations">Operations (Can transact on IB/OB, analysis view)</option>
                    <option value="Inquiry">Inquiry (View only IB/OB & analysis)</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUserId ? 'Reset Password (Leave blank to keep existing)' : 'App Password'}
                </label>
                <input
                  type="password"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder={editingUserId ? 'Keep current password' : 'Initial password'}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* FACO Assignment Checkboxes */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900">
                    Assign Company & Facility (FACO Checkboxes)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Select all facilities
                      const allFaco = facilities.map((f) => ({ companyId: f.companyId, facilityId: f.id }));
                      setUserFormAssignedFaco(allFaco);
                    }}
                    className="text-[11px] text-emerald-800 font-semibold hover:underline"
                  >
                    Select All Facilities
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                  {facilities.map((fac) => {
                    const comp = companies.find((c) => c.id === fac.companyId);
                    const isChecked = userFormAssignedFaco.some(
                      (f) => f.facilityId === fac.id && f.companyId === fac.companyId
                    );

                    return (
                      <label
                        key={fac.id}
                        className={`flex items-start gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormAssignedFaco((prev) => [
                                ...prev,
                                { companyId: fac.companyId, facilityId: fac.id },
                              ]);
                            } else {
                              setUserFormAssignedFaco((prev) =>
                                prev.filter((f) => f.facilityId !== fac.id)
                              );
                            }
                          }}
                          className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700"
                        />
                        <div className="truncate">
                          <div className="font-bold truncate">{fac.code}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {fac.name} · {comp?.code}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* UI Screen Permissions Matrix */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Granular UI Screen Access Permissions
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Screen Name</th>
                        <th className="py-2 px-3 text-center">None</th>
                        <th className="py-2 px-3 text-center">View Only</th>
                        <th className="py-2 px-3 text-center">Edit</th>
                        <th className="py-2 px-3 text-center">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {screensList.map((screen) => {
                        const currentLvl = userFormPermissions[screen.id] || 'none';
                        return (
                          <tr key={screen.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3">
                              <span className="font-semibold text-slate-900">{screen.label}</span>
                            </td>
                            {(['none', 'view', 'edit', 'all'] as PermissionLevel[]).map((level) => (
                              <td key={level} className="py-1.5 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`perm_${screen.id}`}
                                  checked={currentLvl === level}
                                  onChange={() => {
                                    setUserFormPermissions((prev) => ({
                                      ...prev,
                                      [screen.id]: level,
                                    }));
                                  }}
                                  className="text-emerald-800 focus:ring-emerald-700"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
                >
                  Save User & Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPANY */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingCompanyId ? 'Edit Company (Legal Entity)' : 'Add New Company'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="e.g. STL_RETAIL"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Unique commercial abbreviation or ERP code</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Starlinks E-Commerce Distribution"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Status Toggle: Enable / Disable */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompanyStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      companyStatus === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Enabled (Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyStatus('INACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      companyStatus === 'INACTIVE'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs ring-1 ring-slate-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span>Disabled (Inactive)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingCompanyId ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FACILITY */}
      {isFacilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingFacilityId ? 'Edit Warehouse Facility' : 'Add Warehouse Facility'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFacilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3.5">
              {/* Defined Companies Dropdown List with Multiple Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Defined Companies <span className="text-emerald-800 font-semibold">({facilityCompanyIds.length} selected)</span> <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFacilityCompanyIds(companies.map((c) => c.id))}
                      className="text-emerald-800 hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilityCompanyIds([])}
                      className="text-slate-500 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Dropdown Container */}
                <div className="relative">
                  <div
                    onClick={() => setIsCompMultiDropdownOpen(!isCompMultiDropdownOpen)}
                    className="w-full min-h-[42px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg cursor-pointer flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center flex-1 pr-2">
                      {facilityCompanyIds.length === 0 ? (
                        <span className="text-slate-400 italic">Click here to open Defined Companies dropdown...</span>
                      ) : (
                        facilityCompanyIds.map((cId) => {
                          const comp = companies.find((c) => c.id === cId);
                          if (!comp) return null;
                          return (
                            <span
                              key={cId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-950 font-mono text-[11px] font-bold border border-emerald-300"
                            >
                              <span>{comp.code}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCompanyInFacility(cId);
                                }}
                                className="hover:text-red-600 rounded-full cursor-pointer ml-0.5"
                                title="Remove company"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isCompMultiDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Dropdown List Popover */}
                  {isCompMultiDropdownOpen && (
                    <div className="absolute z-60 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 space-y-2 max-h-60 flex flex-col">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={compDropdownSearch}
                          onChange={(e) => setCompDropdownSearch(e.target.value)}
                          placeholder="Search defined companies..."
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1 divide-y divide-slate-100 flex-1 pr-1">
                        {companies
                          .filter(
                            (c) =>
                              c.code.toLowerCase().includes(compDropdownSearch.toLowerCase().trim()) ||
                              c.name.toLowerCase().includes(compDropdownSearch.toLowerCase().trim())
                          )
                          .map((comp) => {
                            const isSelected = facilityCompanyIds.includes(comp.id);
                            return (
                              <div
                                key={comp.id}
                                onClick={() => handleToggleCompanyInFacility(comp.id)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors pt-2 ${
                                  isSelected
                                    ? 'bg-emerald-50/80 text-emerald-950 font-medium'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs text-slate-900">{comp.code}</span>
                                      {comp.status === 'INACTIVE' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                                          Disabled
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block leading-tight">{comp.name}</span>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-emerald-800 shrink-0" />}
                              </div>
                            );
                          })}
                        {companies.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No companies defined yet. Please define companies in Company Master first.
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Multiple selection enabled</span>
                        <button
                          type="button"
                          onClick={() => setIsCompMultiDropdownOpen(false)}
                          className="px-2.5 py-1 font-bold text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facility Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={facilityCode}
                    onChange={(e) => setFacilityCode(e.target.value)}
                    placeholder="e.g. RUH-WH05"
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={facilityCity}
                    onChange={(e) => setFacilityCity(e.target.value)}
                    placeholder="e.g. Riyadh"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facility Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. Riyadh Air Cargo Hub"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Status Toggle: Enable / Disable */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFacilityStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      facilityStatus === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Enabled (Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityStatus('INACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      facilityStatus === 'INACTIVE'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs ring-1 ring-slate-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span>Disabled (Inactive)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingFacilityId ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PALLET SPECIFICATION */}
      {isPalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPalletId ? 'Edit Pallet Specification' : 'Add Pallet Specification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPalletId
                      ? 'Update dimensions, tare weight, material ratings, and operational status.'
                      : 'Define new standardized pallet dimensions, tare weights, and ratings.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPalletModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePalletType} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pallet Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={palletCode}
                    onChange={(e) => setPalletCode(e.target.value)}
                    placeholder="e.g. COMPOSITE_STD"
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Material</label>
                  <select
                    value={palletMaterial}
                    onChange={(e) => setPalletMaterial(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="Wood">Wood</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Metal">Metal</option>
                    <option value="Composite">Composite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pallet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={palletName}
                  onChange={(e) => setPalletName(e.target.value)}
                  placeholder="e.g. Heavy Duty Composite Euro Pallet"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Length (L)</label>
                    <input
                      type="number"
                      value={palletLength}
                      onChange={(e) => setPalletLength(e.target.value)}
                      placeholder="120"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Width (W)</label>
                    <input
                      type="number"
                      value={palletWidth}
                      onChange={(e) => setPalletWidth(e.target.value)}
                      placeholder="100"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Height (H)</label>
                    <input
                      type="number"
                      value={palletHeight}
                      onChange={(e) => setPalletHeight(e.target.value)}
                      placeholder="15"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Weights & Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tare Weight (kg)</label>
                  <input
                    type="number"
                    value={palletTare}
                    onChange={(e) => setPalletTare(e.target.value)}
                    placeholder="22"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Safe Load (kg)</label>
                  <input
                    type="number"
                    value={palletMaxLoad}
                    onChange={(e) => setPalletMaxLoad(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Status Segmented Control */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPalletStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      palletStatus === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Enabled (Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPalletStatus('INACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      palletStatus === 'INACTIVE'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs ring-1 ring-slate-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span>Disabled (Inactive)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPalletModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingPalletId ? 'Save Pallet Changes' : 'Create Pallet Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DOCUMENT REFERENCE TYPE */}
      {isDocRefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDocRefId ? 'Edit Document Reference Type' : 'Add Document Reference Type'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingDocRefId
                      ? 'Update document code, display name, logistics use, and active status.'
                      : 'Define document types recognized during inbound/outbound transactions.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDocRefModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocRefType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doc Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docRefCode}
                  onChange={(e) => setDocRefCode(e.target.value)}
                  placeholder="e.g. BILL_LADING"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docRefName}
                  onChange={(e) => setDocRefName(e.target.value)}
                  placeholder="e.g. Master Bill of Lading (BOL)"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logistics Use / Description</label>
                <textarea
                  value={docRefDesc}
                  onChange={(e) => setDocRefDesc(e.target.value)}
                  placeholder="e.g. Ocean transport manifest or carrier bill of lading reference identifier"
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Status Segmented Control */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocRefStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      docRefStatus === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Enabled (Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocRefStatus('INACTIVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      docRefStatus === 'INACTIVE'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs ring-1 ring-slate-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span>Disabled (Inactive)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocRefModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingDocRefId ? 'Save Doc Ref Changes' : 'Create Doc Ref Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE PALLET TYPE */}
      {deletingPallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Pallet Specification?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-900">{deletingPallet.name}</strong> (
                  <span className="font-mono text-emerald-800 font-bold">{deletingPallet.code}</span>)?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                  <strong>Notice:</strong> Pallet types recorded in historical inbound or outbound transactions cannot
                  be deleted to preserve audit integrity. If this pallet type is in use, please set its status to{' '}
                  <em>Disabled</em> instead.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPallet(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePallet}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Pallet Type</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE DOC REF TYPE */}
      {deletingDocRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Document Reference Type?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-900">{deletingDocRef.name}</strong> (
                  <span className="font-mono text-emerald-800 font-bold">{deletingDocRef.code}</span>)?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                  <strong>Notice:</strong> Document reference types referenced in transactions cannot be deleted. If you
                  no longer wish to use this doc ref category, you can set its status to <em>Disabled</em>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDocRef(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDocRef}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Doc Ref Type</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
