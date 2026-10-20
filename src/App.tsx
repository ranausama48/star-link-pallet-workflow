/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
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
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PalletInboundView } from './components/PalletInboundView';
import { PalletOutboundView } from './components/PalletOutboundView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';

const USER_SESSION_KEY = 'starlinks_palletflow_user';
const FACO_SESSION_KEY = 'starlinks_palletflow_faco';

export default function App() {
  // Avoid reading localStorage during initial render (SSR/hydration mismatch)
  const [sessionReady, setSessionReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved) as UserAccount);
      }
    } catch {
      // ignore invalid session
    }
    setSessionReady(true);
  }, []);

  // Master Data States
  const [companies, setCompanies] = useState<Company[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [docRefTypes, setDocRefTypes] = useState<DocRefType[]>([]);
  const [transactions, setTransactions] = useState<PalletTransaction[]>([]);
  const [sohRecords, setSohRecords] = useState<StockOnHandRecord[]>([]);
  const [oracleConfig, setOracleConfig] = useState<OracleWmsConfig | null>(null);
  const [oracleUsers, setOracleUsers] = useState<OracleWmsUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('pallet_inbound');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active FACO context
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [activeFacilityId, setActiveFacilityId] = useState<string>('');

  // Initial Data Loader
  const loadMasterData = useCallback(async () => {
    try {
      const data = await api.getBootstrap();

      setCompanies(data.companies || []);
      setFacilities(data.facilities || []);
      setPalletTypes(data.palletTypes || []);
      setDocRefTypes(data.docRefTypes || []);
      setTransactions(data.transactions || []);
      setSohRecords(data.sohRecords || []);
      setOracleConfig(data.oracleConfig || null);
      setOracleUsers(data.oracleUsers || []);
      setAllUsers(data.users || []);

      // Demo default: only if no saved session after hydration
      const savedSession = localStorage.getItem(USER_SESSION_KEY);
      if (!savedSession && data.users && data.users.length > 0) {
        const rootAdmin = data.users.find((u) => u.username === 'obaidullah.r') || data.users[0];
        setCurrentUser(rootAdmin);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(rootAdmin));
      }
    } catch (err) {
      console.error('Failed to load initial master data:', err);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    loadMasterData();
  }, [sessionReady, loadMasterData]);

  // Synchronize Active FACO context based on current user's assignments
  useEffect(() => {
    if (!currentUser || companies.length === 0 || facilities.length === 0) return;

    try {
      const savedFaco = localStorage.getItem(FACO_SESSION_KEY);
      if (savedFaco) {
        const parsed = JSON.parse(savedFaco);
        const compExists = companies.some((c) => c.id === parsed.companyId);
        const facExists = facilities.some((f) => f.id === parsed.facilityId);
        if (compExists && facExists) {
          setActiveCompanyId(parsed.companyId);
          setActiveFacilityId(parsed.facilityId);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Default to user's first assigned FACO
    const firstAssignment = currentUser.assignedFaco?.[0];
    if (firstAssignment) {
      setActiveCompanyId(firstAssignment.companyId);
      setActiveFacilityId(firstAssignment.facilityId);
    } else {
      setActiveCompanyId(companies[0]?.id || '');
      const firstFac = facilities.find((f) => f.companyId === companies[0]?.id) || facilities[0];
      setActiveFacilityId(firstFac?.id || '');
    }
  }, [currentUser, companies, facilities]);

  // Handle switching company
  const handleSelectCompany = (compId: string) => {
    setActiveCompanyId(compId);
    // Find first facility in this company
    const firstFac = facilities.find((f) => f.companyId === compId);
    if (firstFac) {
      setActiveFacilityId(firstFac.id);
      localStorage.setItem(
        FACO_SESSION_KEY,
        JSON.stringify({ companyId: compId, facilityId: firstFac.id })
      );
    }
  };

  // Handle switching facility
  const handleSelectFacility = (facId: string) => {
    setActiveFacilityId(facId);
    localStorage.setItem(
      FACO_SESSION_KEY,
      JSON.stringify({ companyId: activeCompanyId, facilityId: facId })
    );
  };

  // Handle Login
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));

    // Reset FACO to new user's assigned
    if (user.assignedFaco && user.assignedFaco.length > 0) {
      setActiveCompanyId(user.assignedFaco[0].companyId);
      setActiveFacilityId(user.assignedFaco[0].facilityId);
      localStorage.setItem(FACO_SESSION_KEY, JSON.stringify(user.assignedFaco[0]));
    }

    // Default screen based on role
    if (user.role === 'Inquiry') {
      setCurrentTab('analytics_soh');
    } else {
      setCurrentTab('pallet_inbound');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
  };

  // Refresh data on transaction creation or edit
  const refreshTransactionsAndSOH = async () => {
    try {
      const [txns, soh] = await Promise.all([api.getTransactions(), api.getSOH()]);
      setTransactions(txns);
      setSohRecords(soh);
    } catch (e) {
      console.error('Error refreshing transactions and SOH:', e);
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex items-center justify-center font-sans">
        <p className="text-sm text-slate-500">Loading session…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        user={currentUser}
        companies={companies}
        facilities={facilities}
        activeCompanyId={activeCompanyId}
        activeFacilityId={activeFacilityId}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-[1700px] w-full mx-auto">
        {/* Sidebar Menu Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          user={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          companies={companies}
          facilities={facilities}
          activeCompanyId={activeCompanyId}
          activeFacilityId={activeFacilityId}
          onSelectCompany={handleSelectCompany}
          onSelectFacility={handleSelectFacility}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB: PALLET INBOUND */}
          {currentTab === 'pallet_inbound' && (
            <PalletInboundView
              user={currentUser}
              companies={companies}
              facilities={facilities}
              palletTypes={palletTypes}
              docRefTypes={docRefTypes}
              activeCompanyId={activeCompanyId}
              activeFacilityId={activeFacilityId}
              recentTransactions={transactions}
              onTransactionCreated={refreshTransactionsAndSOH}
            />
          )}

          {/* TAB: PALLET OUTBOUND */}
          {currentTab === 'pallet_outbound' && (
            <PalletOutboundView
              user={currentUser}
              companies={companies}
              facilities={facilities}
              palletTypes={palletTypes}
              docRefTypes={docRefTypes}
              activeCompanyId={activeCompanyId}
              activeFacilityId={activeFacilityId}
              recentTransactions={transactions}
              sohRecords={sohRecords}
              onTransactionCreated={refreshTransactionsAndSOH}
            />
          )}

          {/* TAB: ANALYTICS (SOH, IB, OB, VISUALS) */}
          {(currentTab === 'analytics_soh' ||
            currentTab === 'analytics_ib' ||
            currentTab === 'analytics_ob' ||
            currentTab === 'analytics_visuals') && (
            <AnalyticsView
              activeTab={
                currentTab === 'analytics_ib'
                  ? 'ib'
                  : currentTab === 'analytics_ob'
                  ? 'ob'
                  : currentTab === 'analytics_visuals'
                  ? 'visuals'
                  : 'soh'
              }
              user={currentUser}
              companies={companies}
              facilities={facilities}
              palletTypes={palletTypes}
              docRefTypes={docRefTypes}
              transactions={transactions}
              sohRecords={sohRecords}
              activeCompanyId={activeCompanyId}
              activeFacilityId={activeFacilityId}
            />
          )}

          {/* TAB: ADMIN & MASTER (USERS, COMPANY, FACILITY, PALLETS, DOC REF, ORACLE) */}
          {(currentTab === 'admin_users' ||
            currentTab === 'admin_company' ||
            currentTab === 'admin_facility' ||
            currentTab === 'admin_faco' ||
            currentTab === 'admin_pallets' ||
            currentTab === 'admin_docref' ||
            currentTab === 'admin_oracle') && (
            <AdminPanel
              currentSubTab={currentTab}
              currentUser={currentUser}
              users={allUsers}
              companies={companies}
              facilities={facilities}
              palletTypes={palletTypes}
              docRefTypes={docRefTypes}
              oracleConfig={
                oracleConfig || {
                  apiUrl: '',
                  authType: 'SIMULATED',
                  apiKeyOrToken: '',
                  enabled: true,
                }
              }
              oracleUsers={oracleUsers}
              onDataChanged={loadMasterData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
