/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowUpRight,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Hash,
  Boxes,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  Minus,
} from 'lucide-react';
import { api } from '../api';
import { Company, Facility, PalletType, DocRefType, PalletTransaction, UserAccount, StockOnHandRecord } from '../types';
import { BulkUploadModal } from './BulkUploadModal';

interface PalletOutboundViewProps {
  user: UserAccount;
  companies: Company[];
  facilities: Facility[];
  palletTypes: PalletType[];
  docRefTypes: DocRefType[];
  activeCompanyId: string;
  activeFacilityId: string;
  recentTransactions: PalletTransaction[];
  sohRecords: StockOnHandRecord[];
  onTransactionCreated: () => void;
}

export function PalletOutboundView({
  user,
  companies,
  facilities,
  palletTypes,
  docRefTypes,
  activeCompanyId,
  activeFacilityId,
  recentTransactions,
  sohRecords,
  onTransactionCreated,
}: PalletOutboundViewProps) {
  // Outbound sources with appropriate clean short names
  const outboundSources = [
    { code: 'OUT_ORDER', label: 'Out on Order', description: 'Dispatched on customer order' },
    { code: 'IOT_XFER', label: 'IOT Transfer', description: 'Facility to Facility Transfer' },
    { code: 'DMG_SIGNOFF', label: 'Damage Signoff', description: 'Damage Pallet Decommission/Write-off' },
    { code: 'DMG_SOLD', label: 'Damage Sold', description: 'Damaged scrap pallets sold' },
  ];

  const quickQuantities = [1, 5, 10, 20, 25, 50, 100, 200];

  // Form states
  const [source, setSource] = useState('OUT_ORDER');
  const [docRefTypeId, setDocRefTypeId] = useState(docRefTypes[0]?.id || '');
  const [docRefNumber, setDocRefNumber] = useState('');
  const [palletTypeId, setPalletTypeId] = useState(palletTypes[0]?.id || '');
  const [qtyInput, setQtyInput] = useState('20');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const selectedPallet = palletTypes.find((p) => p.id === palletTypeId) || palletTypes[0];

  // Calculate current available SOH for the selected pallet type at active facility
  const matchingSoh = sohRecords.find(
    (s) => s.facilityId === activeFacilityId && s.palletTypeId === palletTypeId
  );
  const availableStock = matchingSoh ? matchingSoh.currentSOH : 0;

  // Check if operations or edit allowed
  const canEdit =
    user.role === 'Admin' ||
    user.role === 'Operations' ||
    user.screenPermissions?.pallet_outbound === 'edit' ||
    user.screenPermissions?.pallet_outbound === 'all';

  const parsedQty = parseInt(qtyInput, 10);
  const isFormValid =
    Boolean(source) &&
    Boolean(docRefTypeId) &&
    Boolean(docRefNumber.trim()) &&
    Boolean(palletTypeId) &&
    !isNaN(parsedQty) &&
    parsedQty > 0 &&
    Boolean(activeCompanyId) &&
    Boolean(activeFacilityId);

  const isExceedingStock = !isNaN(parsedQty) && parsedQty > availableStock;

  // Submit Ship Handler
  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !canEdit) return;

    setIsSubmitting(true);
    setSuccessAlert(null);
    setErrorAlert(null);

    const sourceObj = outboundSources.find((s) => s.code === source);

    try {
      const res = await api.createTransaction({
        type: 'OUTBOUND',
        source,
        sourceLabel: sourceObj?.label || source,
        companyId: activeCompanyId,
        facilityId: activeFacilityId,
        docRefTypeId,
        docRefNumber: docRefNumber.trim(),
        palletTypeId,
        qty: parsedQty,
        notes: notes.trim(),
        user,
      });

      setSuccessAlert(
        `Successfully shipped ${parsedQty} ${selectedPallet?.code || 'pallets'} under Doc Ref #${docRefNumber.trim()}`
      );
      setDocRefNumber('');
      setNotes('');
      onTransactionCreated();
    } catch (err: any) {
      setErrorAlert(err.message || 'Failed to register outbound pallets');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counter increment/decrement handlers
  const handleDecrement = () => {
    const current = parseInt(qtyInput, 10);
    const nextVal = isNaN(current) ? 1 : Math.max(1, current - 1);
    setQtyInput(String(nextVal));
  };

  const handleIncrement = () => {
    const current = parseInt(qtyInput, 10);
    const nextVal = isNaN(current) ? 1 : current + 1;
    setQtyInput(String(nextVal));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <ArrowUpRight className="w-5 h-5 text-emerald-800 shrink-0" />
            <span>OUTBOUND PALLET RECEPTION</span>
          </h1>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 rounded-lg shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-800" />
            <span>Bulk Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Main Focused Outbound Form */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pallet Outbound Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All fields are mandatory. Outbound decrements active facility Stock on Hand.
            </p>
          </div>
          {!canEdit && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              Inquiry View Only
            </span>
          )}
        </div>

        {/* Feedback Alerts */}
        {successAlert && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessAlert(null)}
              className="text-emerald-700 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {errorAlert && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorAlert(null)}
              className="text-red-700 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleShip} className="space-y-5">
          {/* Field 1: Outbound Source (LOV) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Outbound Source / Reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {outboundSources.map((s) => {
                const isSelected = source === s.code;
                return (
                  <button
                    type="button"
                    key={s.code}
                    onClick={() => setSource(s.code)}
                    className={`py-2.5 px-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-xs truncate">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 2: Doc Ref Type LOV & Doc Ref Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doc Ref Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={docRefTypeId}
                  onChange={(e) => setDocRefTypeId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                >
                  {docRefTypes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doc Ref # (Shipment / Order / PO#) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={docRefNumber}
                  onChange={(e) => setDocRefNumber(e.target.value)}
                  placeholder="e.g. SO-RUH-8821 or TO-4410"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Field 3: Pallet Type (Drop Down) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Pallet Type <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Current SOH: <strong className={availableStock > 0 ? 'text-emerald-800' : 'text-red-600'}>{availableStock}</strong> units
              </span>
            </div>
            <div className="relative">
              <Boxes className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={palletTypeId}
                onChange={(e) => setPalletTypeId(e.target.value)}
                required
                className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 cursor-pointer"
              >
                {palletTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field 4: Quantity (Writeable numeric with Up/Down Counter) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              {isExceedingStock && (
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Notice: Qty exceeds on-hand stock ({availableStock})
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={parsedQty <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Decrease quantity by 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <Boxes className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    placeholder="Enter or write quantity..."
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Increase quantity by 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select Pill Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
                {quickQuantities.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setQtyInput(String(q))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      qtyInput === String(q)
                        ? 'bg-emerald-800 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Shipment Remarks / Destination (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Loaded on Trailer 8192, outbound seal #4402"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
            />
          </div>

          {/* Ship Button (Enabled when valid) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || !canEdit}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>Recording Outbound Dispatch...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ship Pallets ({parsedQty || 0} Units)
                </>
              )}
            </button>
            {!canEdit && (
              <p className="text-[11px] text-amber-700 text-center mt-1.5">
                Your current role ({user.role}) has Inquiry View Only rights on this screen.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        type="OUTBOUND"
        companies={companies}
        facilities={facilities}
        palletTypes={palletTypes}
        docRefTypes={docRefTypes}
        activeCompanyId={activeCompanyId}
        activeFacilityId={activeFacilityId}
        user={user}
        onUploadSuccess={(count) => {
          setSuccessAlert(`Bulk upload processed: Successfully shipped ${count} pallet records.`);
          onTransactionCreated();
        }}
      />
    </div>
  );
}
