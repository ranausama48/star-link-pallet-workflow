/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  History,
  Settings,
  Users,
  Building2,
  Warehouse,
  Layers,
  FileCheck,
  Cpu,
  ChevronRight,
  SlidersHorizontal,
  Search,
  X,
  Check,
} from 'lucide-react';
import { ScreenId, UserAccount, Company, Facility } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserAccount;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  companies: Company[];
  facilities: Facility[];
  activeCompanyId: string;
  activeFacilityId: string;
  onSelectCompany: (companyId: string) => void;
  onSelectFacility: (facilityId: string) => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  user,
  isMobileOpen,
  onCloseMobile,
  companies,
  facilities,
  activeCompanyId,
  activeFacilityId,
  onSelectCompany,
  onSelectFacility,
}: SidebarProps) {
  // Popups state with search
  const [isCompanyPopupOpen, setIsCompanyPopupOpen] = useState(false);
  const [isFacilityPopupOpen, setIsFacilityPopupOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [facilitySearch, setFacilitySearch] = useState('');

  // Close popups on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCompanyPopupOpen(false);
        setIsFacilityPopupOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter companies assigned to this user (or all if admin)
  const userAssignedCompIds = new Set(user.assignedFaco?.map((f) => f.companyId) || []);
  const availableCompanies =
    user.role === 'Admin'
      ? companies
      : companies.filter((c) => userAssignedCompIds.has(c.id));

  // Facilities assigned to this user for the active company
  const userAssignedFacIds = new Set(
    user.assignedFaco
      ?.filter((f) => f.companyId === activeCompanyId)
      .map((f) => f.facilityId) || []
  );

  const isFacilityInActiveCompany = (f: Facility) => {
    if (f.companyIds && Array.isArray(f.companyIds) && f.companyIds.length > 0) {
      return f.companyIds.includes(activeCompanyId);
    }
    return f.companyId === activeCompanyId;
  };

  const availableFacilities =
    user.role === 'Admin'
      ? facilities.filter(isFacilityInActiveCompany)
      : facilities.filter((f) => isFacilityInActiveCompany(f) && userAssignedFacIds.has(f.id));

  const currentCompany = companies.find((c) => c.id === activeCompanyId);
  const currentFacility = facilities.find((f) => f.id === activeFacilityId);

  // Filtered lists for type search
  const filteredCompanies = availableCompanies.filter(
    (c) =>
      c.code.toLowerCase().includes(companySearch.toLowerCase().trim()) ||
      c.name.toLowerCase().includes(companySearch.toLowerCase().trim())
  );

  const filteredFacilities = availableFacilities.filter(
    (f) =>
      f.code.toLowerCase().includes(facilitySearch.toLowerCase().trim()) ||
      f.name.toLowerCase().includes(facilitySearch.toLowerCase().trim()) ||
      (f.city && f.city.toLowerCase().includes(facilitySearch.toLowerCase().trim()))
  );
  // Check user screen permissions
  const hasPermission = (screenId: ScreenId) => {
    if (user.role === 'Admin') return true;
    if (screenId === 'admin_company' || screenId === 'admin_facility') {
      const specific = user.screenPermissions?.[screenId];
      if (specific && specific !== 'none') return true;
      const legacy = user.screenPermissions?.['admin_faco'];
      return Boolean(legacy && legacy !== 'none');
    }
    const perm = user.screenPermissions?.[screenId];
    return Boolean(perm && perm !== 'none');
  };

  const navItems = [
    {
      id: 'pallet_inbound',
      label: 'Pallet Inbound',
      icon: ArrowDownLeft,
      description: 'Receive & register incoming pallets',
      allowed: hasPermission('pallet_inbound'),
      badge: user.role === 'Inquiry' ? 'View Only' : undefined,
    },
    {
      id: 'pallet_outbound',
      label: 'Pallet Outbound',
      icon: ArrowUpRight,
      description: 'Ship, transfer or signoff pallets',
      allowed: hasPermission('pallet_outbound'),
      badge: user.role === 'Inquiry' ? 'View Only' : undefined,
    },
  ];

  const analyticsItems = [
    {
      id: 'analytics_soh',
      label: 'Stock on Hand | SOH',
      icon: Boxes,
      allowed: hasPermission('analytics_soh'),
    },
    {
      id: 'analytics_ib',
      label: 'IB Pallet',
      icon: ArrowDownLeft,
      allowed: hasPermission('analytics_ib'),
    },
    {
      id: 'analytics_ob',
      label: 'OB Pallet',
      icon: ArrowUpRight,
      allowed: hasPermission('analytics_ob'),
    },
    {
      id: 'analytics_visuals',
      label: 'Analysis & Charts',
      icon: BarChart3,
      allowed: hasPermission('analytics_visuals'),
    },
  ];

  const adminItems = [
    {
      id: 'admin_users',
      label: 'Users & RBAC',
      icon: Users,
      allowed: user.role === 'Admin',
    },
    {
      id: 'admin_company',
      label: 'Company Master',
      icon: Building2,
      allowed: user.role === 'Admin' || user.role === 'Management' || hasPermission('admin_company') || hasPermission('admin_faco'),
    },
    {
      id: 'admin_facility',
      label: 'Facility Master',
      icon: Warehouse,
      allowed: user.role === 'Admin' || user.role === 'Management' || hasPermission('admin_facility') || hasPermission('admin_faco'),
    },
    {
      id: 'admin_pallets',
      label: 'Pallet Types Master',
      icon: Layers,
      allowed: user.role === 'Admin' || user.role === 'Management',
    },
    {
      id: 'admin_docref',
      label: 'Doc Ref Types',
      icon: FileCheck,
      allowed: user.role === 'Admin' || user.role === 'Management',
    },
    {
      id: 'admin_oracle',
      label: 'Oracle WMS API Link',
      icon: Cpu,
      allowed: user.role === 'Admin',
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Normal Menu Navigators: Company & Facility */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setCompanySearch('');
                setIsCompanyPopupOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Building2 className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="truncate">Company</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-200 text-slate-700">
                {currentCompany?.code || 'Select'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFacilitySearch('');
                setIsFacilityPopupOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Warehouse className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="truncate">Facility</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-200 text-slate-700">
                {currentFacility?.code || 'Select'}
              </span>
            </button>
          </div>

          {/* Section: Core Pallet Operations */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Operations
            </div>

            {navItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Section: Analytics */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Analytics</span>
            </div>

            {analyticsItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Section: Administration (Admin & Management) */}
          {(user.role === 'Admin' || user.role === 'Management') && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Admin & Master</span>
                <span className="text-[10px] font-mono font-semibold text-emerald-800">
                  {user.role}
                </span>
              </div>

              {adminItems
                .filter((item) => item.allowed)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Bottom System Health & Oracle Status */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Oracle WMS
            </span>
            <span className="font-mono text-emerald-800 font-semibold">Active</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Active sync & User verification
          </p>
        </div>
      </aside>

      {/* POPUP DROPDOWN LIST: CHANGE COMPANY (TYPE SEARCH ENABLED) */}
      {isCompanyPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setIsCompanyPopupOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Company
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select active company context ({availableCompanies.length} available)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanyPopupOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Search Input Bar */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Type to search company by code or name..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
                {companySearch && (
                  <button
                    type="button"
                    onClick={() => setCompanySearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown List of Companies */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredCompanies.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No companies found matching "{companySearch}"</p>
                  <button
                    type="button"
                    onClick={() => setCompanySearch('')}
                    className="mt-2 text-emerald-800 font-semibold hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                filteredCompanies.map((c) => {
                  const isSelected = c.id === activeCompanyId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCompany(c.id);
                        setIsCompanyPopupOpen(false);
                        setCompanySearch('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-700/20 text-emerald-950 font-semibold'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                          {c.code}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Status: <span className="text-emerald-700 font-semibold">{c.status}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsCompanyPopupOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DROPDOWN LIST: CHANGE FACILITY (TYPE SEARCH ENABLED) */}
      {isFacilityPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setIsFacilityPopupOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Facility
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Facilities under <span className="font-semibold text-slate-700">{currentCompany?.code || 'Company'}</span> ({availableFacilities.length} available)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFacilityPopupOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Search Input Bar */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  placeholder="Type to search facility by code, name, or city..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
                {facilitySearch && (
                  <button
                    type="button"
                    onClick={() => setFacilitySearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown List of Facilities */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredFacilities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No facilities found matching "{facilitySearch}"</p>
                  <button
                    type="button"
                    onClick={() => setFacilitySearch('')}
                    className="mt-2 text-emerald-800 font-semibold hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                filteredFacilities.map((f) => {
                  const isSelected = f.id === activeFacilityId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onSelectFacility(f.id);
                        setIsFacilityPopupOpen(false);
                        setFacilitySearch('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-700/20 text-emerald-950 font-semibold'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                          {f.code}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{f.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {f.city} · <span className="text-emerald-700 font-semibold">{f.status}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsFacilityPopupOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
