/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { UserAccount, Company, Facility } from '../types';

interface NavbarProps {
  user: UserAccount;
  companies: Company[];
  facilities: Facility[];
  activeCompanyId: string;
  activeFacilityId: string;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Navbar({
  user,
  companies,
  facilities,
  activeCompanyId,
  activeFacilityId,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: NavbarProps) {
  const currentCompany = companies.find((c) => c.id === activeCompanyId);
  const currentFacility = facilities.find((f) => f.id === activeFacilityId);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Starlinks Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-black text-base shadow-xs">
              ★
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-none whitespace-nowrap">
                STARLINKS
              </span>
              <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase leading-none mt-0.5">
                Pallet Flow
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Compact clean scope indicator in navbar */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-mono font-bold text-slate-700">
          <span>{currentCompany?.code || 'N/A'}</span>
          <span className="text-slate-400 font-normal">/</span>
          <span className="text-emerald-800">{currentFacility?.code || 'N/A'}</span>
        </div>

        {/* Zone 3: Profile & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 font-bold text-xs shrink-0 overflow-hidden">
              <img
                src="/src/assets/images/warehouse_operator_avatar_1792055863541.jpg"
                alt={user.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="hidden fallback-initial">{user.fullName.charAt(0)}</span>
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                {user.fullName}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className="text-emerald-800 font-semibold">{user.role}</span>
                <span>·</span>
                <span className="font-mono">{user.username}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            title="Sign out of warehouse app"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
