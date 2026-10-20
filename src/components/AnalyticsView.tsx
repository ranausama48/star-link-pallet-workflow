/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Download,
  Filter,
  Calendar,
  Search,
  Building2,
  Warehouse,
  User,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  PalletTransaction,
  Company,
  Facility,
  PalletType,
  DocRefType,
  UserAccount,
  StockOnHandRecord,
} from '../types';
import { MonthlyBarChart, FacilityComparisonChart, DistributionChart } from './Charts';

interface AnalyticsViewProps {
  activeTab?: 'soh' | 'ib' | 'ob' | 'visuals';
  initialSubTab?: 'soh' | 'ib' | 'ob' | 'visuals';
  user: UserAccount;
  companies: Company[];
  facilities: Facility[];
  palletTypes: PalletType[];
  docRefTypes?: DocRefType[];
  transactions: PalletTransaction[];
  sohRecords: StockOnHandRecord[];
  activeCompanyId: string;
  activeFacilityId: string;
}

export function AnalyticsView({
  activeTab: controlledTab,
  initialSubTab = 'soh',
  user,
  companies,
  facilities,
  palletTypes,
  docRefTypes = [],
  transactions,
  sohRecords,
  activeCompanyId,
  activeFacilityId,
}: AnalyticsViewProps) {
  const activeTab = controlledTab ?? initialSubTab;

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterFacilityId, setFilterFacilityId] = useState('');
  const [filterPalletTypeId, setFilterPalletTypeId] = useState('');
  const [filterDocRefTypeId, setFilterDocRefTypeId] = useState('');
  const [filterDocRefText, setFilterDocRefText] = useState('');
  const [filterUserText, setFilterUserText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Reset pagination and search when navigating to a different analysis view
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

  // Filter accessible companies and facilities based on user's assignment
  const userAssignedCompIds = new Set(user.assignedFaco?.map((f) => f.companyId) || []);
  const userAssignedFacIds = new Set(user.assignedFaco?.map((f) => f.facilityId) || []);

  const accessibleCompanies =
    user.role === 'Admin'
      ? companies
      : companies.filter((c) => userAssignedCompIds.has(c.id));

  const accessibleFacilities =
    user.role === 'Admin'
      ? facilities
      : facilities.filter((f) => userAssignedFacIds.has(f.id));

  // Reset Filters
  const handleResetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCompanyId('');
    setFilterFacilityId('');
    setFilterPalletTypeId('');
    setFilterDocRefTypeId('');
    setFilterDocRefText('');
    setFilterUserText('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // Filtered Transactions
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Must be within user's assigned scope
      if (user.role !== 'Admin') {
        if (!userAssignedCompIds.has(t.companyId)) return false;
        if (!userAssignedFacIds.has(t.facilityId)) return false;
      }

      // Explicit Filters
      if (filterCompanyId && t.companyId !== filterCompanyId) return false;
      if (filterFacilityId && t.facilityId !== filterFacilityId) return false;
      if (filterPalletTypeId && t.palletTypeId !== filterPalletTypeId) return false;
      if (filterDocRefTypeId && t.docRefTypeId !== filterDocRefTypeId) return false;

      // Doc Ref. Filter (Matches document reference number or document reference type)
      if (filterDocRefText) {
        const refSearch = filterDocRefText.toLowerCase().trim();
        const matchesRef =
          t.docRefNumber.toLowerCase().includes(refSearch) ||
          t.docRefTypeName?.toLowerCase().includes(refSearch);
        if (!matchesRef) return false;
      }

      if (filterUserText) {
        const u = filterUserText.toLowerCase();
        const matchesUser =
          t.createdByUsername?.toLowerCase().includes(u) ||
          t.createdByName?.toLowerCase().includes(u);
        if (!matchesUser) return false;
      }

      if (filterStartDate) {
        const start = new Date(filterStartDate).getTime();
        if (new Date(t.timestamp).getTime() < start) return false;
      }

      if (filterEndDate) {
        // End of that day
        const end = new Date(filterEndDate).getTime() + 86400000;
        if (new Date(t.timestamp).getTime() > end) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          t.docRefNumber.toLowerCase().includes(q) ||
          t.sourceLabel.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.palletTypeCode.toLowerCase().includes(q) ||
          t.facilityCode.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [
    transactions,
    user,
    userAssignedCompIds,
    userAssignedFacIds,
    filterCompanyId,
    filterFacilityId,
    filterPalletTypeId,
    filterDocRefTypeId,
    filterDocRefText,
    filterUserText,
    filterStartDate,
    filterEndDate,
    searchQuery,
  ]);

  // Separate IB and OB datasets
  const ibTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'INBOUND'),
    [filteredTransactions]
  );
  const obTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'OUTBOUND'),
    [filteredTransactions]
  );

  // -------------------------------------------------------------
  // Overall KPIs:
  // Prompt: "Stock will not date dependent it will be the total on hand qty after OB"
  // -------------------------------------------------------------
  const totalStockOnHand = useMemo(() => {
    // Total IB minus Total OB across user-assigned facilities
    const relevant = transactions.filter((t) => {
      if (user.role === 'Admin') return true;
      return userAssignedCompIds.has(t.companyId) && userAssignedFacIds.has(t.facilityId);
    });

    const totalIb = relevant.filter((t) => t.type === 'INBOUND').reduce((s, t) => s + t.qty, 0);
    const totalOb = relevant.filter((t) => t.type === 'OUTBOUND').reduce((s, t) => s + t.qty, 0);
    return totalIb - totalOb;
  }, [transactions, user, userAssignedCompIds, userAssignedFacIds]);

  const kpis = useMemo(() => {
    const totalIb = filteredTransactions
      .filter((t) => t.type === 'INBOUND')
      .reduce((s, t) => s + t.qty, 0);
    const totalOb = filteredTransactions
      .filter((t) => t.type === 'OUTBOUND')
      .reduce((s, t) => s + t.qty, 0);
    const totalDmg = filteredTransactions
      .filter((t) => t.source === 'DMG_SIGNOFF' || t.source === 'DMG_SOLD')
      .reduce((s, t) => s + t.qty, 0);

    return {
      totalSOH: totalStockOnHand,
      filteredIB: totalIb,
      filteredOB: totalOb,
      filteredDamage: totalDmg,
      activeFacilities: accessibleFacilities.length,
    };
  }, [filteredTransactions, totalStockOnHand, accessibleFacilities]);

  // -------------------------------------------------------------
  // SOH Records Filtered
  // -------------------------------------------------------------
  const filteredSohRecords = useMemo(() => {
    return sohRecords.filter((s) => {
      if (user.role !== 'Admin') {
        if (!userAssignedCompIds.has(s.companyId)) return false;
        if (!userAssignedFacIds.has(s.facilityId)) return false;
      }
      if (filterCompanyId && s.companyId !== filterCompanyId) return false;
      if (filterFacilityId && s.facilityId !== filterFacilityId) return false;
      if (filterPalletTypeId && s.palletTypeId !== filterPalletTypeId) return false;
      return true;
    });
  }, [sohRecords, user, userAssignedCompIds, userAssignedFacIds, filterCompanyId, filterFacilityId, filterPalletTypeId]);

  // -------------------------------------------------------------
  // Visuals & Trends Aggregations
  // -------------------------------------------------------------
  const monthlyTrendsData = useMemo(() => {
    const map: Record<string, { month: string; ib: number; ob: number }> = {};
    filteredTransactions.forEach((t) => {
      const m = t.timestamp.slice(0, 7);
      if (!map[m]) map[m] = { month: m, ib: 0, ob: 0 };
      if (t.type === 'INBOUND') map[m].ib += t.qty;
      else map[m].ob += t.qty;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const facilityComparisonData = useMemo(() => {
    const map: Record<string, { code: string; name: string; ib: number; ob: number; soh: number }> = {};
    accessibleFacilities.forEach((f) => {
      map[f.id] = { code: f.code, name: f.name, ib: 0, ob: 0, soh: 0 };
    });

    filteredTransactions.forEach((t) => {
      if (map[t.facilityId]) {
        if (t.type === 'INBOUND') map[t.facilityId].ib += t.qty;
        else map[t.facilityId].ob += t.qty;
      }
    });

    Object.keys(map).forEach((fid) => {
      map[fid].soh = map[fid].ib - map[fid].ob;
    });

    return Object.values(map);
  }, [accessibleFacilities, filteredTransactions]);

  const palletTypeBreakdown = useMemo(() => {
    const map: Record<string, { label: string; value: number }> = {};
    palletTypes.forEach((p) => {
      map[p.id] = { label: p.code, value: 0 };
    });
    filteredTransactions.forEach((t) => {
      if (map[t.palletTypeId]) {
        map[t.palletTypeId].value += t.qty;
      }
    });
    return Object.values(map).filter((m) => m.value > 0);
  }, [palletTypes, filteredTransactions]);

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { label: string; value: number }> = {};
    filteredTransactions.forEach((t) => {
      const label = t.sourceLabel || t.source;
      if (!map[label]) map[label] = { label, value: 0 };
      map[label].value += t.qty;
    });
    return Object.values(map);
  }, [filteredTransactions]);

  // -------------------------------------------------------------
  // CSV Exporter
  // -------------------------------------------------------------
  const handleExportCSV = (dataset: 'soh' | 'ib' | 'ob') => {
    let csv = '';
    if (dataset === 'soh') {
      csv = 'Company,Facility,PalletType,TotalInbound,TotalOutbound,StockOnHand,LastMovement\n';
      filteredSohRecords.forEach((r) => {
        csv += `"${r.companyName}","${r.facilityName}","${r.palletTypeCode}",${r.totalInbound},${r.totalOutbound},${r.currentSOH},"${r.lastMovementTime || 'N/A'}"\n`;
      });
    } else {
      const list = dataset === 'ib' ? ibTransactions : obTransactions;
      csv = 'Company,Facility,Source,DocRef,PalletType,Qty,CreateUser,Timestamp\n';
      list.forEach((t) => {
        csv += `"${t.companyName}","${t.facilityName}","${t.sourceLabel}","${t.docRefNumber}","${t.palletTypeCode}",${t.qty},"${t.createdByName || t.createdByUsername}","${t.timestamp}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Starlinks_${dataset.toUpperCase()}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine current active table dataset for pagination
  const currentTableList =
    activeTab === 'ib' ? ibTransactions : activeTab === 'ob' ? obTransactions : [];
  const totalPages = Math.max(1, Math.ceil(currentTableList.length / pageSize));
  const paginatedList = currentTableList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* KPI Top Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SOH (Not strictly date dependent) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Stock on Hand</span>
            <Boxes className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-950 tabular-nums">
            {kpis.totalSOH.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">
            Cumulative Available Pallets
          </p>
        </div>

        {/* Total Inbound (IB) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Inbound (IB)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {kpis.filteredIB.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Received Pallets (Filtered)</p>
        </div>

        {/* Total Outbound (OB) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Outbound (OB)</span>
            <ArrowUpRight className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {kpis.filteredOB.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dispatched Pallets (Filtered)</p>
        </div>

        {/* Damaged / Signoff */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Damaged / Scrap</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-900 tabular-nums">
            {kpis.filteredDamage.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Signoff & Scrap Salvage</p>
        </div>
      </div>

      {/* Current Analysis View Header & Action Bar (Navigation managed via Menu Navigator) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {activeTab === 'soh' && (
              <>
                <Boxes className="w-5 h-5 text-emerald-800" />
                <span>Stock on Hand | SOH</span>
              </>
            )}
            {activeTab === 'ib' && (
              <>
                <ArrowDownLeft className="w-5 h-5 text-emerald-800" />
                <span>IB Pallet Analysis</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({ibTransactions.length} records)
                </span>
              </>
            )}
            {activeTab === 'ob' && (
              <>
                <ArrowUpRight className="w-5 h-5 text-emerald-800" />
                <span>OB Pallet Analysis</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({obTransactions.length} records)
                </span>
              </>
            )}
            {activeTab === 'visuals' && (
              <>
                <BarChart3 className="w-5 h-5 text-emerald-800" />
                <span>Analysis & Charts</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'soh' && 'Real-time stock on hand balance across facilities and pallet types'}
            {activeTab === 'ib' && 'Inbound pallet reception audit ledger and historical transaction log'}
            {activeTab === 'ob' && 'Outbound pallet dispatch audit ledger and movement tracking log'}
            {activeTab === 'visuals' && 'Throughput trends, monthly pallet volume, and distribution charts'}
          </p>
        </div>

        {/* Export CSV Button */}
        {activeTab !== 'visuals' && (
          <button
            type="button"
            onClick={() => handleExportCSV(activeTab as 'soh' | 'ib' | 'ob')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export {activeTab.toUpperCase()} CSV</span>
          </button>
        )}
      </div>

      {/* Global Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-800" />
            Filter Parameters:
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Company LOV */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Company</label>
            <select
              value={filterCompanyId}
              onChange={(e) => {
                setFilterCompanyId(e.target.value);
                setFilterFacilityId('');
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate"
            >
              <option value="">All Companies</option>
              {accessibleCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Facility LOV */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Facility</label>
            <select
              value={filterFacilityId}
              onChange={(e) => setFilterFacilityId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate"
            >
              <option value="">All Facilities</option>
              {accessibleFacilities
                .filter((f) => !filterCompanyId || f.companyId === filterCompanyId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Pallet Type LOV */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Pallet Type</label>
            <select
              value={filterPalletTypeId}
              onChange={(e) => setFilterPalletTypeId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate"
            >
              <option value="">All Pallet Types</option>
              {palletTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.name})
                </option>
              ))}
            </select>
          </div>

          {/* Doc Ref Type LOV */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Doc Ref. Type</label>
            <select
              value={filterDocRefTypeId}
              onChange={(e) => setFilterDocRefTypeId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate"
            >
              <option value="">All Doc Ref Types</option>
              {docRefTypes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doc Ref Filter Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Doc Ref. Filter</label>
            <input
              type="text"
              value={filterDocRefText}
              onChange={(e) => setFilterDocRefText(e.target.value)}
              placeholder="e.g. PO-8821, SHP..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* User Search Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">User Filter</label>
            <input
              type="text"
              value={filterUserText}
              onChange={(e) => setFilterUserText(e.target.value)}
              placeholder="e.g. khalid.ops"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: Stock on Hand | SOH */}
      {activeTab === 'soh' && (
        <div className="space-y-4">
          {/* SOH Pallet Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {palletTypes.map((p) => {
              const matching = filteredSohRecords.filter((s) => s.palletTypeId === p.id);
              const totalPalletSoh = matching.reduce((sum, s) => sum + s.currentSOH, 0);
              const totalIb = matching.reduce((sum, s) => sum + s.totalInbound, 0);
              const totalOb = matching.reduce((sum, s) => sum + s.totalOutbound, 0);

              return (
                <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{p.code}</span>
                    <span className="text-[10px] font-normal text-slate-500 font-mono">
                      {p.lengthCm}×{p.widthCm}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-emerald-950 tabular-nums my-1">
                    {totalPalletSoh} <span className="text-xs font-normal text-slate-400">units</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
                    <span>IB: {totalIb}</span>
                    <span>OB: {totalOb}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed SOH Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock on Hand by Facility & Pallet</h3>
                <p className="text-xs text-slate-500">Live on-hand balance per warehouse facility</p>
              </div>
              <span className="text-xs font-mono text-slate-600 font-semibold">
                {filteredSohRecords.length} Rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Company</th>
                    <th className="py-2.5 px-4">Facility</th>
                    <th className="py-2.5 px-4">Pallet Type</th>
                    <th className="py-2.5 px-4 text-right">Inbound (IB)</th>
                    <th className="py-2.5 px-4 text-right">Outbound (OB)</th>
                    <th className="py-2.5 px-4 text-right">Available SOH</th>
                    <th className="py-2.5 px-4">Last Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredSohRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-4 font-sans font-medium text-slate-800">{r.companyName}</td>
                      <td className="py-2 px-4 font-sans font-semibold text-slate-900">{r.facilityName}</td>
                      <td className="py-2 px-4 text-slate-800">
                        <span className="font-bold">{r.palletTypeCode}</span>
                        <span className="text-[10px] text-slate-400 font-sans ml-1">· {r.palletTypeName}</span>
                      </td>
                      <td className="py-2 px-4 text-right font-medium text-emerald-800">+{r.totalInbound}</td>
                      <td className="py-2 px-4 text-right font-medium text-slate-600">-{r.totalOutbound}</td>
                      <td className="py-2 px-4 text-right font-bold text-base text-slate-900 tabular-nums">
                        {r.currentSOH}
                      </td>
                      <td className="py-2 px-4 text-slate-400 font-sans text-[11px]">
                        {r.lastMovementTime
                          ? new Date(r.lastMovementTime).toLocaleDateString()
                          : 'No movement yet'}
                      </td>
                    </tr>
                  ))}
                  {filteredSohRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        No SOH records found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: IB Pallet & OB Pallet History Tables */}
      {(activeTab === 'ib' || activeTab === 'ob') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activeTab === 'ib' ? 'Inbound Pallet Movements' : 'Outbound Pallet Dispatches'}
              </h3>
              <p className="text-xs text-slate-500">
                Audit ledger of every pallet {activeTab === 'ib' ? 'received' : 'shipped'} with user and time details
              </p>
            </div>

            {/* In-table search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search DocRef, Source, User..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Table with specified columns: Company | Facility | Source | Doc Ref. | Pallet Type | Qty | Create User | Time stamp */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-4">Facility</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Doc Ref.</th>
                  <th className="py-2.5 px-4">Pallet Type</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4">Create User</th>
                  <th className="py-2.5 px-4">Time stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {paginatedList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-sans text-slate-800">{t.companyName}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{t.facilityName}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-emerald-900 font-sans">{t.sourceLabel}</span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      <span>{t.docRefNumber}</span>
                      <span className="block text-[10px] text-slate-400 font-normal font-sans">
                        {t.docRefTypeName}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-800">{t.palletTypeCode}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-sm text-slate-900 tabular-nums">
                      {activeTab === 'ib' ? (
                        <span className="text-emerald-800">+{t.qty}</span>
                      ) : (
                        <span className="text-slate-700">-{t.qty}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      <div className="font-medium text-slate-900">{t.createdByName || t.createdByUsername}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.createdByUsername}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {paginatedList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No {activeTab.toUpperCase()} transactions found matching the filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, currentTableList.length)} of {currentTableList.length} records
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: Analysis & Visualizations */}
      {activeTab === 'visuals' && (
        <div className="space-y-6">
          {/* Section 1: Month-wise Inbound vs Outbound Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Month-Wise Inbound / Outbound Analysis</h3>
                <p className="text-xs text-slate-500">Monthly pallet throughput comparison</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded-xs bg-emerald-800 inline-block" />
                  Inbound (IB)
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
                  Outbound (OB)
                </span>
              </div>
            </div>

            <MonthlyBarChart data={monthlyTrendsData} />
          </div>

          {/* Section 2: Facility Wise Comparison & Pallet Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Facility Comparison */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Facility Wise Pallet Comparison</h3>
                <p className="text-xs text-slate-500">Available SOH and capacity distribution across facilities</p>
              </div>

              <FacilityComparisonChart facilities={facilityComparisonData} />
            </div>

            {/* Pallet Type Analysis */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Pallet Type Analysis</h3>
                <p className="text-xs text-slate-500">Inventory volume by pallet material and standard</p>
              </div>

              <DistributionChart items={palletTypeBreakdown} title="Pallet Types" />
            </div>
          </div>

          {/* Section 3: Pallet Source Wise Analysis */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Pallet Source & Movement Reason Analysis</h3>
              <p className="text-xs text-slate-500">
                Distribution by channel (Market Purchase, Shipment Receipts, Vendor Returns, IOT, Order Outbounds, Damage)
              </p>
            </div>

            <DistributionChart items={sourceBreakdown} title="Movement Sources" />
          </div>
        </div>
      )}
    </div>
  );
}
